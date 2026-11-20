import type { NextRequest } from "next/server";
import { z } from "zod";
import { decodeVin } from "@/lib/server/adapters/vin.adapter";
import { AppError } from "@/lib/server/errors";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";

const vinRequestSchema = z.object({
  vin: z.unknown().optional(),
});

/**
 * POST /api/vin/decode
 * Public VIN decoder backed by ISO 3779 validation, Postgres 30-day cache,
 * and NHTSA vPIC with a 3-second timeout + manual fallback (FR-EU-03 / AC-01).
 */
export const POST = handleApiRoute(async (request: NextRequest) => {
  const rl = await enforceRateLimit(request, "vin_decode");
  const body = await parseBody(request, vinRequestSchema);
  if (typeof body.vin !== "string" || body.vin.trim().length === 0) {
    throw new AppError({
      status: 400,
      code: "INVALID_VIN",
      message: "A 17-character VIN is required.",
      fields: { vin: "VIN is required" },
    });
  }

  const result = await decodeVin(body.vin);
  const cacheHeader = result.cached
    ? "HIT"
    : result.fallbackManual
      ? "FALLBACK"
      : "MISS";

  return ok(
    {
      ...result.decoded,
      cached: result.cached,
      fallbackManual: result.fallbackManual,
    },
    200,
    { "X-VIN-Cache": cacheHeader, ...rateLimitHeaders(rl) }
  );
});
