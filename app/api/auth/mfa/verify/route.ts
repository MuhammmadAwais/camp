import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import {
  verifyTotpFactor,
  verifyTotpSchema,
} from "@/lib/server/services/mfa.service";

function extractIpAddress(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip")?.trim() || null;
}

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const rl = await enforceRateLimit(request, "auth_verify", {
    scopeKey: ctx.userId,
  });
  const payload = await parseBody(request, verifyTotpSchema);

  const data = await verifyTotpFactor(ctx, payload, {
    ipAddress: extractIpAddress(request.headers),
  });
  return ok(data, 200, rateLimitHeaders(rl));
});
