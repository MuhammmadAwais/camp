import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_ROUTE_PREFIXES, REFRESH_COOKIE_NAME } from "@/lib/auth-routing";

// Optimistic check only: no refresh cookie means definitely signed out, so skip rendering the portal.
// The real authorization happens in the API (and the client guard handles expired cookies).
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/verify-kyc/:path*", "/list-car/:path*"],
};
