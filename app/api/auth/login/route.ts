import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { loginWithPassword } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const rl = await enforceRateLimit(request, "auth_login");
  const payload = await parseBody(request, loginSchema);
  const session = await loginWithPassword(payload);
  return ok(session, 200, rateLimitHeaders(rl));
});
