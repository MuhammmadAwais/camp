import type { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { requestPasswordReset } from "@/lib/server/services/auth.service";

// Always responds 200 so the endpoint cannot be used to enumerate accounts.
export const POST = handleApiRoute(async (request: NextRequest) => {
  const rl = await enforceRateLimit(request, "auth_password_forgot");
  const payload = await parseBody(request, forgotPasswordSchema);
  const result = await requestPasswordReset(payload.email);
  return ok(result, 200, rateLimitHeaders(rl));
});
