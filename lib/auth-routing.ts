import type { SessionUser } from "@/lib/types/auth";

// Shared by proxy.ts (edge) and client code, so keep this file free of server-only imports.
export const REFRESH_COOKIE_NAME = "autonexa_rt";

export const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/verify-kyc", "/list-car"];

// Only same-origin relative paths are accepted as a post-login destination (prevents open redirects).
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

export function getPostAuthRoute(user: SessionUser, next?: string | null): string {
  const safeNext = sanitizeNextPath(next);
  const needsKyc = user.kycStatus === "NOT_STARTED" || user.kycStatus === "REJECTED" || user.kycStatus === "EXPIRED";
  if (needsKyc) return "/verify-kyc";
  return safeNext ?? "/dashboard";
}
