import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import {
  requestAccountDeletion,
  requestAccountDeletionSchema,
} from "@/lib/server/services/privacy.service";

function extractIpAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

/**
 * POST /api/settings/privacy/delete
 * Schedules a 30-day PIPEDA / Quebec Law 25 right-to-erasure workflow and revokes sessions.
 */
export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const rl = await enforceRateLimit(request, "privacy_delete", {
    scopeKey: ctx.userId,
  });

  const payload = await parseBody(request, requestAccountDeletionSchema);
  const result = await requestAccountDeletion(ctx, payload, {
    ipAddress: extractIpAddress(request),
    userAgent: request.headers.get("user-agent") ?? null,
  });

  return ok(result, 200, rateLimitHeaders(rl));
});
