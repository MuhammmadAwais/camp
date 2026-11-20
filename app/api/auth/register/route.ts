import type { NextRequest } from "next/server";
import { registerPayloadSchema } from "@/lib/schemas/auth-schema";
import { created, handleApiRoute, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { registerAccount } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const rl = await enforceRateLimit(request, "auth_register");
  const payload = await parseBody(request, registerPayloadSchema);
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const pending = await registerAccount(payload, { ipAddress, userAgent });
  return created(pending, rateLimitHeaders(rl));
});
