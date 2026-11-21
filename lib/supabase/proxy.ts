import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import {
  type AppLocale,
  getDefaultPortalForRole,
  isProtectedRoute,
  isRoleAllowedForPath,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/auth-routing";
import type { Database } from "@/lib/supabase/database.types";
import type { UserRole } from "@/lib/types/auth";

const handleI18nRouting = createMiddleware(routing);

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

function preserveIntlState(
  targetResponse: NextResponse,
  intlResponse: NextResponse | null
): void {
  if (!intlResponse) return;
  intlResponse.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "set-cookie" && lower !== "x-middleware-request-cookie") {
      targetResponse.headers.set(key, value);
    }
  });
  intlResponse.cookies.getAll().forEach((cookie) => {
    targetResponse.cookies.set(cookie);
  });
}

/**
 * Composes `next-intl` locale routing with Supabase Auth session cookie refresh (`getClaims()`)
 * and enforces portal-level authentication and RBAC redirects under `/[locale]`.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next({ request });
  }

  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  const intlResponse = isApiRoute ? null : handleI18nRouting(request);

  if (intlResponse?.headers.get("location")) {
    return intlResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return intlResponse ?? NextResponse.next({ request });
  }

  let supabaseResponse = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        const nextResponse = NextResponse.next({ request });
        preserveIntlState(nextResponse, intlResponse);
        cookiesToSet.forEach(({ name, value, options }) =>
          nextResponse.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) =>
          nextResponse.headers.set(key, value)
        );
        supabaseResponse = nextResponse;
      },
    },
  });

  // Never trust unvalidated cookie sessions — always verify JWT via getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims?.sub);

  if (!isApiRoute) {
    const { locale: urlLocale, pathname: strippedPath } = stripLocalePrefix(pathname);
    const activeLocale: AppLocale = urlLocale ?? "en";

    if (isProtectedRoute(strippedPath)) {
      if (!isAuthenticated) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = withLocalePrefix("/login", activeLocale);
        loginUrl.search = "";
        loginUrl.searchParams.set(
          "next",
          `${strippedPath}${request.nextUrl.search}`
        );
        return redirectWithCookies(loginUrl, supabaseResponse);
      }

      const role = extractRoleFromAppMetadata(claims?.app_metadata);
      if (role && !isRoleAllowedForPath(strippedPath, role)) {
        const portalUrl = request.nextUrl.clone();
        portalUrl.pathname = withLocalePrefix(
          getDefaultPortalForRole(role),
          activeLocale
        );
        portalUrl.search = "";
        return redirectWithCookies(portalUrl, supabaseResponse);
      }
    }
  }

  return supabaseResponse;
}
