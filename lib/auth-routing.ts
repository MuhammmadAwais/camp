import type { SessionUser, UserRole } from "@/lib/types/auth";

export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// Shared by proxy.ts (edge) and client code, so keep this file free of server-only imports.
// Legacy mock cookie name preserved until mock routes are replaced in Prompt B2.2.
export const REFRESH_COOKIE_NAME = "autonexa_rt";

export const PROTECTED_ROUTE_PREFIXES = [
  "/seller",
  "/dealer",
  "/admin",
  "/dashboard",
  "/verify-kyc",
  "/list-car",
  "/settings",
] as const;

export const PUBLIC_DEALER_ROUTES = ["/dealer/register"] as const;

export function stripLocalePrefix(pathname: string): {
  locale: AppLocale | null;
  pathname: string;
} {
  for (const locale of SUPPORTED_LOCALES) {
    if (pathname === `/${locale}`) {
      return { locale, pathname: "/" };
    }
    if (pathname.startsWith(`/${locale}/`)) {
      const stripped = pathname.slice(locale.length + 1);
      return { locale, pathname: stripped || "/" };
    }
  }
  return { locale: null, pathname: pathname || "/" };
}

export function withLocalePrefix(pathname: string, locale: AppLocale): string {
  const { pathname: normalized } = stripLocalePrefix(pathname);
  if (normalized === "/") {
    return `/${locale}`;
  }
  const clean = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `/${locale}${clean}`;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getDefaultPortalForRole(role: UserRole): string {
  if (role === "ADMIN") return "/admin/moderation";
  if (role === "DEALER_ADMIN" || role === "DEALER_AGENT") return "/dealer/inventory";
  return "/seller/dashboard";
}

export function isProtectedRoute(pathname: string): boolean {
  const { pathname: normalized } = stripLocalePrefix(pathname);
  if (PUBLIC_DEALER_ROUTES.some((route) => matchesPrefix(normalized, route))) {
    return false;
  }
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
}

export function isRoleAllowedForPath(pathname: string, role: UserRole): boolean {
  const { pathname: normalized } = stripLocalePrefix(pathname);

  if (matchesPrefix(normalized, "/admin")) {
    return role === "ADMIN";
  }

  if (PUBLIC_DEALER_ROUTES.some((route) => matchesPrefix(normalized, route))) {
    return true;
  }

  if (matchesPrefix(normalized, "/dealer/billing") || matchesPrefix(normalized, "/dealer/team")) {
    return role === "DEALER_ADMIN" || role === "ADMIN";
  }

  if (matchesPrefix(normalized, "/dealer")) {
    return role === "DEALER_ADMIN" || role === "DEALER_AGENT" || role === "ADMIN";
  }

  if (
    matchesPrefix(normalized, "/seller") ||
    matchesPrefix(normalized, "/dashboard") ||
    matchesPrefix(normalized, "/list-car") ||
    matchesPrefix(normalized, "/verify-kyc")
  ) {
    return role === "SELLER" || role === "ADMIN";
  }

  // `/settings` and public paths are accessible to any authenticated role.
  return true;
}

// Only same-origin relative paths are accepted as a post-login destination (prevents open redirects).
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  const queryIdx = next.indexOf("?");
  const rawPath = queryIdx >= 0 ? next.slice(0, queryIdx) : next;
  const search = queryIdx >= 0 ? next.slice(queryIdx) : "";
  const { pathname: normalized } = stripLocalePrefix(rawPath);
  return `${normalized}${search}`;
}

export function getPostAuthRoute(user: SessionUser, next?: string | null): string {
  const safeNext = sanitizeNextPath(next);

  if (user.role === "SELLER") {
    const needsKyc =
      user.kycStatus === "NOT_STARTED" ||
      user.kycStatus === "REJECTED" ||
      user.kycStatus === "EXPIRED";
    if (needsKyc) return "/verify-kyc";
  }

  if (safeNext && isRoleAllowedForPath(safeNext, user.role)) {
    return safeNext;
  }

  return getDefaultPortalForRole(user.role);
}
