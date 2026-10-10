import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_ROUTE_PREFIXES, REFRESH_COOKIE_NAME } from "@/lib/auth-routing";

// Optimistic check only: no refresh cookie means definitely signed out, so skip rendering the portal.
// The real authorization happens in the API (and the client guard handles expired cookies).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected || request.cookies.has(REFRESH_COOKIE_NAME)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/verify-kyc/:path*", "/list-car/:path*"],
};
