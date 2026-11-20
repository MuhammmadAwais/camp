import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getDefaultPortalForRole,
  isProtectedRoute,
  isRoleAllowedForPath,
} from "@/lib/auth-routing";
import type { Database } from "@/lib/supabase/database.types";
import type { UserRole } from "@/lib/types/auth";

const VALID_ROLES: readonly UserRole[] = [
  "SELLER",
  "DEALER_ADMIN",
  "DEALER_AGENT",
  "ADMIN",
];

function extractRoleFromAppMetadata(appMetadata: unknown): UserRole | null {
  if (typeof appMetadata !== "object" || appMetadata === null) return null;
  const candidate = (appMetadata as Record<string, unknown>).role;
  if (typeof candidate !== "string") return null;
  return VALID_ROLES.find((role) => role === candidate) ?? null;
}

function redirectWithCookies(
  targetUrl: URL,
  sourceResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(targetUrl);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

/**
 * Refreshes Supabase Auth session cookies via `getClaims()` (verified JWT signature)
 * and enforces portal-level authentication and RBAC redirects.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        );
      },
    },
  });

  // Never trust unvalidated cookie sessions — always verify JWT via getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`
      );
      return redirectWithCookies(loginUrl, supabaseResponse);
    }

    const role = extractRoleFromAppMetadata(claims?.app_metadata);
    if (role && !isRoleAllowedForPath(pathname, role)) {
      const portalUrl = request.nextUrl.clone();
      portalUrl.pathname = getDefaultPortalForRole(role);
      portalUrl.search = "";
      return redirectWithCookies(portalUrl, supabaseResponse);
    }
  }

  return supabaseResponse;
}
