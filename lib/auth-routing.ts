import type { SessionUser, UserRole } from "@/lib/types/auth";

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

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getDefaultPortalForRole(role: UserRole): string {
  if (role === "ADMIN") return "/admin/moderation";
  if (role === "DEALER_ADMIN" || role === "DEALER_AGENT") return "/dealer/inventory";
  return "/seller/dashboard";
}

export function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_DEALER_ROUTES.some((route) => matchesPrefix(pathname, route))) {
    return false;
  }
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isRoleAllowedForPath(pathname: string, role: UserRole): boolean {
  if (matchesPrefix(pathname, "/admin")) {
    return role === "ADMIN";
  }

  if (PUBLIC_DEALER_ROUTES.some((route) => matchesPrefix(pathname, route))) {
    return true;
  }

  if (matchesPrefix(pathname, "/dealer/billing") || matchesPrefix(pathname, "/dealer/team")) {
    return role === "DEALER_ADMIN" || role === "ADMIN";
  }

  if (matchesPrefix(pathname, "/dealer")) {
    return role === "DEALER_ADMIN" || role === "DEALER_AGENT" || role === "ADMIN";
  }

  if (
    matchesPrefix(pathname, "/seller") ||
    matchesPrefix(pathname, "/dashboard") ||
    matchesPrefix(pathname, "/list-car") ||
    matchesPrefix(pathname, "/verify-kyc")
  ) {
    return role === "SELLER" || role === "ADMIN";
  }

  // `/settings` and public paths are accessible to any authenticated role.
  return true;
}

// Only same-origin relative paths are accepted as a post-login destination (prevents open redirects).
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
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
