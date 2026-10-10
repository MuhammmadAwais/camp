import type { NextRequest } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth-routing";
import { db } from "@/lib/mock/db";
import { clearSessionCookie, mockApiDisabled, ok } from "@/lib/mock/http";

export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const token = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (token) db.refreshTokens.delete(token);

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) db.accessTokens.delete(header.slice(7));

  return clearSessionCookie(ok({ loggedOut: true }));
}
