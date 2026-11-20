import type { DecodedVehicle } from "@/lib/schemas/vehicle-schema";
import { AppError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { isValidVin, sanitizeVinInput } from "@/lib/vin";

export const VPIC_TIMEOUT_MS = 3_000;
export const VIN_CACHE_TTL_DAYS = 30;

export type VinDecodeResult = {
  decoded: DecodedVehicle;
  cached: boolean;
  fallbackManual: boolean;
};

export type VinDecodeOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  bypassCache?: boolean;
};

type VpicFlatResult = Record<string, string | null | undefined>;
type VinCacheInsert = Database["public"]["Tables"]["vin_decode_cache"]["Insert"];

const ACRONYM_MAKES = new Set(["BMW", "GMC", "RAM", "MINI", "BYD", "MG"]);

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === "not applicable") {
    return null;
  }
  return trimmed;
}

function formatMake(value: string | null): string | null {
  if (!value) return null;
  return value
    .split(/(\s+|-)/)
    .map((token) => {
      if (/^\s+$/.test(token) || token === "-") return token;
      const upper = token.toUpperCase();
      if (ACRONYM_MAKES.has(upper)) return upper;
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join("");
}

function formatEngine(
  displacementRaw: string | null | undefined,
  cylindersRaw: string | null | undefined
): string | null {
  const displacement = clean(displacementRaw);
  if (!displacement) return null;

  const parsed = Number.parseFloat(displacement);
  if (Number.isNaN(parsed) || parsed <= 0) return null;

  const cylinders = clean(cylindersRaw);
  return `${parsed.toFixed(1)}L${cylinders ? ` ${cylinders}-cyl` : ""}`;
}

function buildManualFallback(vin: string): DecodedVehicle {
  return {
    vin,
    year: null,
    make: null,
    model: null,
    trim: null,
    bodyStyle: null,
    engine: null,
    transmission: null,
    drivetrain: null,
    fuelType: null,
    source: "MANUAL",
  };
}

/**
 * Validates length (17 chars, no I/O/Q) and ISO 3779 check digit (BR-02 / FR-EU-03).
 */
export function validateAndNormalizeVin(rawVin: string): string {
  const vin = sanitizeVinInput(rawVin);
  if (vin.length !== 17) {
    throw new AppError({
      status: 400,
      code: "INVALID_VIN",
      message:
        "A VIN must contain exactly 17 valid characters (excluding I, O, and Q).",
      fields: { vin: "A VIN has exactly 17 characters" },
    });
  }

  if (!isValidVin(vin)) {
    throw new AppError({
      status: 400,
      code: "INVALID_VIN",
      message:
        "This VIN fails the ISO 3779 check-digit test — please re-check each character.",
      fields: {
        vin: "This VIN fails the check-digit test — please re-check each character",
      },
    });
  }

  return vin;
}

/**
 * Decodes a validated 17-char Canadian/North American VIN using 30-day
 * Postgres cache (`vin_decode_cache`) + NHTSA vPIC API with a strict 3s timeout
 * and graceful manual-entry fallback (FR-EU-03, AC-01).
 */
export async function decodeVin(
  rawVin: string,
  options: VinDecodeOptions = {}
): Promise<VinDecodeResult> {
  const vin = validateAndNormalizeVin(rawVin);
  const admin = createAdminSupabaseClient();

  if (!options.bypassCache) {
    try {
      const { data: cachedRow, error: cacheReadErr } = await admin
        .from("vin_decode_cache")
        .select("*")
        .eq("vin", vin)
        .maybeSingle();

      if (
        !cacheReadErr &&
        cachedRow &&
        new Date(cachedRow.expires_at).getTime() > Date.now() &&
        cachedRow.year !== null &&
        cachedRow.make &&
        cachedRow.model
      ) {
        return {
          decoded: {
            vin,
            year: cachedRow.year,
            make: cachedRow.make,
            model: cachedRow.model,
            trim: cachedRow.trim,
            bodyStyle: cachedRow.body_style,
            engine: cachedRow.engine_spec,
            transmission: cachedRow.transmission,
            drivetrain: cachedRow.drivetrain,
            fuelType: cachedRow.fuel_type,
            source: "VPIC",
          },
          cached: true,
          fallbackManual: false,
        };
      }
    } catch (error: unknown) {
      logger.warn("VIN cache read failed; continuing to NHTSA vPIC", {
        meta: { vinPrefix: vin.slice(0, 8), error },
      });
    }
  }

  const fetchFn = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? VPIC_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      logger.warn("NHTSA vPIC decode returned non-OK status; using manual fallback", {
        meta: { vinPrefix: vin.slice(0, 8), status: response.status },
      });
      return {
        decoded: buildManualFallback(vin),
        cached: false,
        fallbackManual: true,
      };
    }

    const payload: unknown = await response.json();
    const rawResult: VpicFlatResult | undefined =
      typeof payload === "object" &&
      payload !== null &&
      "Results" in payload &&
      Array.isArray((payload as { Results: unknown }).Results)
        ? (payload as { Results: VpicFlatResult[] }).Results[0]
        : undefined;

    if (!rawResult) {
      logger.warn("NHTSA vPIC decode returned empty results; using manual fallback", {
        meta: { vinPrefix: vin.slice(0, 8), reason: "empty_results" },
      });
      return {
        decoded: buildManualFallback(vin),
        cached: false,
        fallbackManual: true,
      };
    }

    const year = Number.parseInt(rawResult.ModelYear ?? "", 10);
    const make = formatMake(clean(rawResult.Make));
    const model = clean(rawResult.Model);

    if (!make || !model || Number.isNaN(year)) {
      logger.warn("NHTSA vPIC decode incomplete; using manual fallback", {
        meta: { vinPrefix: vin.slice(0, 8), reason: "missing_core_fields" },
      });
      return {
        decoded: buildManualFallback(vin),
        cached: false,
        fallbackManual: true,
      };
    }

    const decoded: DecodedVehicle = {
      vin,
      year,
      make,
      model,
      trim: clean(rawResult.Trim) ?? clean(rawResult.Series),
      bodyStyle: clean(rawResult.BodyClass),
      engine: formatEngine(rawResult.DisplacementL, rawResult.EngineCylinders),
      transmission: clean(rawResult.TransmissionStyle),
      drivetrain: clean(rawResult.DriveType),
      fuelType: clean(rawResult.FuelTypePrimary),
      source: "VPIC",
    };

    try {
      const nowMs = Date.now();
      const cachedAt = new Date(nowMs).toISOString();
      const expiresAt = new Date(
        nowMs + VIN_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error: upsertErr } = await admin.from("vin_decode_cache").upsert(
        {
          vin,
          year: decoded.year,
          make: decoded.make,
          model: decoded.model,
          trim: decoded.trim,
          body_style: decoded.bodyStyle,
          engine_spec: decoded.engine,
          transmission: decoded.transmission,
          drivetrain: decoded.drivetrain,
          fuel_type: decoded.fuelType,
          raw_payload: rawResult as VinCacheInsert["raw_payload"],
          provider: "nhtsa_vpic",
          cached_at: cachedAt,
          expires_at: expiresAt,
        },
        { onConflict: "vin" }
      );

      if (upsertErr) {
        logger.warn("VIN cache write failed; returning decoded result anyway", {
          meta: { vinPrefix: vin.slice(0, 8), error: upsertErr.message },
        });
      }
    } catch (cacheWriteErr: unknown) {
      logger.warn("VIN cache write threw unexpectedly", {
        meta: { vinPrefix: vin.slice(0, 8), error: cacheWriteErr },
      });
    }

    return { decoded, cached: false, fallbackManual: false };
  } catch (error: unknown) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "fetch_failed";
    logger.warn("NHTSA vPIC decode unavailable; returning manual fallback", {
      meta: { vinPrefix: vin.slice(0, 8), reason },
    });
    return {
      decoded: buildManualFallback(vin),
      cached: false,
      fallbackManual: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
