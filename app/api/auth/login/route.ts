import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { loginWithPassword } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const rl = await enforceRateLimit(request, "auth_login");
  const payload = await parseBody(request, loginSchema);
  const session = await loginWithPassword(payload);
  const response = ok(session, 200, rateLimitHeaders(rl));
  if ("user" in session) {
    response.cookies.set(
      "NEXT_LOCALE",
      session.user.languagePref === "fr" ? "fr" : "en",
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      }
    );
  }
  return response;
});
