import type { NextRequest } from "next/server";
import { resendPayloadSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { resendVerificationCode } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const rl = await enforceRateLimit(request, "auth_verify");
  const payload = await parseBody(request, resendPayloadSchema);
  const result = await resendVerificationCode(
    payload.registrationId,
    payload.channel
  );
  return ok(result, 200, rateLimitHeaders(rl));
});
