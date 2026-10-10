import type { NextRequest } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth-routing";
import { consumeToken, db } from "@/lib/mock/db";
import { clearSessionCookie, fail, mockApiDisabled, sessionResponse } from "@/lib/mock/http";

// Rotates the refresh token on every call and returns a fresh in-memory access token.
export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const token = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const user = consumeToken(db.refreshTokens, token);
  if (!user || !token) {
    return clearSessionCookie(fail(401, "SESSION_EXPIRED", "Your session has expired. Please sign in again."));
  }

  db.refreshTokens.delete(token);
  return sessionResponse(user);
}
