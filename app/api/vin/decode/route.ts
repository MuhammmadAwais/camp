import type { NextRequest } from "next/server";
import { mockApiDisabled, ok, parseJson } from "@/lib/mock/http";
import { vinDecodePayloadSchema, type DecodedVehicle } from "@/lib/schemas/vehicle-schema";

const VPIC_TIMEOUT_MS = 3000; // AC-01: decode within 3 seconds or fall back to manual entry.

type VpicFlatResult = Record<string, string | null | undefined>;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "Not Applicable" ? trimmed : null;
}

function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function manualFallback(vin: string): DecodedVehicle {
  return {
    vin, year: null, make: null, model: null, trim: null, bodyStyle: null,
    engine: null, transmission: null, drivetrain: null, fuelType: null, source: "MANUAL",
  };
}

// FR-EU-03 / Fig 7.4 — check digit is validated by the schema, then NHTSA vPIC fills the specs.
// The Express backend will own this (with caching + commercial fallback); this route mirrors its contract.
export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const parsed = await parseJson(request, vinDecodePayloadSchema);
  if ("response" in parsed) return parsed.response;
  const { vin } = parsed.data;

  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`, {
      signal: AbortSignal.timeout(VPIC_TIMEOUT_MS),
    });
    if (!res.ok) return ok(manualFallback(vin));

    const json: unknown = await res.json();
    const result: VpicFlatResult | undefined =
      typeof json === "object" && json !== null && "Results" in json && Array.isArray((json as { Results: unknown }).Results)
        ? (json as { Results: VpicFlatResult[] }).Results[0]
        : undefined;
    if (!result) return ok(manualFallback(vin));

    const year = Number.parseInt(result.ModelYear ?? "", 10);
    const make = titleCase(clean(result.Make));
    const model = clean(result.Model);
    if (!make || !model || Number.isNaN(year)) return ok(manualFallback(vin));

    const displacement = clean(result.DisplacementL);
    const cylinders = clean(result.EngineCylinders);
    const engine = displacement
      ? `${Number.parseFloat(displacement).toFixed(1)}L${cylinders ? ` ${cylinders}-cyl` : ""}`
      : null;

    const decoded: DecodedVehicle = {
      vin,
      year,
      make,
      model,
      trim: clean(result.Trim) ?? clean(result.Series),
      bodyStyle: clean(result.BodyClass),
      engine,
      transmission: clean(result.TransmissionStyle),
      drivetrain: clean(result.DriveType),
      fuelType: clean(result.FuelTypePrimary),
      source: "VPIC",
    };
    return ok(decoded);
  } catch (err) {
    console.error("[mock-api] vPIC decode failed, falling back to manual entry", err);
    return ok(manualFallback(vin));
  }
}
