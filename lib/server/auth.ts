import { PROVINCE_CODES, type ProvinceCode } from "@/lib/canada";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { KycStatus, SessionUser, UserRole } from "@/lib/types/auth";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type DealershipStatus = Database["public"]["Enums"]["dealership_status"];
export type DealerSeatRole = Database["public"]["Enums"]["dealer_seat_role"];
export type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type SessionContext = {
  userId: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatus;
  dealershipId: string | null;
  dealershipStatus: DealershipStatus | null;
  seatRole: DealerSeatRole | null;
  seatActive: boolean;
  aal: string | null;
  profile: ProfileRow;
  supabase: ServerSupabaseClient;
};

export function maskPhone(e164: string | null): string {
  if (!e164 || e164.length < 4) return "(•••) •••-••••";
  return `(•••) •••-${e164.slice(-4)}`;
}

function normalizeProvinceCode(raw: string | null): ProvinceCode {
  if (raw) {
    const upper = raw.toUpperCase();
    const match = PROVINCE_CODES.find((code) => code === upper);
    if (match) return match;
  }
  return "ON";
}

export function toSessionUser(profile: ProfileRow): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phoneMasked: maskPhone(profile.phone_e164),
    postalCode: profile.postal_code ?? "",
    province: normalizeProvinceCode(profile.province),
    role: profile.role,
    kycStatus: profile.kyc_status,
    mfaEnabled: profile.mfa_enabled,
  };
}

export function isPrivilegedMfaRole(
  role: UserRole,
  seatRole?: DealerSeatRole | null
): boolean {
  return (
    role === "ADMIN" ||
    role === "DEALER_ADMIN" ||
    seatRole === "DEALER_ADMIN"
  );
}

/**
 * Loads the server-verified authenticated user via `supabase.auth.getUser()`
 * and hydrates their canonical `profiles` row + dealership membership.
 * Returns `null` when unauthenticated or when profile is missing.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let aal: string | null = null;
  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    if (claimsData?.claims && typeof claimsData.claims.aal === "string") {
      aal = claimsData.claims.aal;
    }
  } catch {
    // Claims lookup is optional for AAL telemetry; getUser() already verified the session.
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  let dealershipStatus: DealershipStatus | null = null;
  let seatRole: DealerSeatRole | null = null;
  let seatActive = false;

  if (profile.dealership_id) {
    const [dealershipRes, memberRes] = await Promise.all([
      supabase
        .from("dealerships")
        .select("status")
        .eq("id", profile.dealership_id)
        .maybeSingle(),
      supabase
        .from("dealership_members")
        .select("seat_role, is_active")
        .eq("dealership_id", profile.dealership_id)
        .eq("user_id", profile.id)
        .maybeSingle(),
    ]);

    dealershipStatus = dealershipRes.data?.status ?? null;
    seatRole = memberRes.data?.seat_role ?? null;
    seatActive = memberRes.data?.is_active ?? false;
  }

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    kycStatus: profile.kyc_status,
    dealershipId: profile.dealership_id,
    dealershipStatus,
    seatRole,
    seatActive,
    aal,
    profile,
    supabase,
  };
}

/**
 * Ensures the caller holds an active, non-suspended authenticated session.
 */
export async function requireAuth(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new UnauthorizedError("Your session has expired. Please sign in again.");
  }

  if (ctx.profile.account_status !== "ACTIVE") {
    throw new ForbiddenError("Your account is not active.");
  }

  return ctx;
}

/**
 * Enforces top-level RBAC against `profiles.role`.
 */
export async function requireRole(
  allowedRoles: readonly UserRole[]
): Promise<SessionContext> {
  const ctx = await requireAuth();
  if (!allowedRoles.includes(ctx.role)) {
    throw new ForbiddenError("You do not have permission to access this resource.");
  }
  return ctx;
}

/**
 * Ensures the caller is a KYC-verified seller (or platform admin) before listing vehicles (BR-01).
 */
export async function requireKycVerified(): Promise<SessionContext> {
  const ctx = await requireRole(["SELLER", "ADMIN"]);
  if (ctx.role !== "ADMIN" && ctx.kycStatus !== "VERIFIED") {
    throw new ForbiddenError(
      "Government ID verification (KYC) must be completed before creating a listing.",
      "KYC_REQUIRED"
    );
  }
  return ctx;
}

/**
 * Ensures the caller belongs to a verified dealership and optionally holds one of the allowed seat roles.
 */
export async function requireActiveDealership(
  allowedSeatRoles?: readonly DealerSeatRole[]
): Promise<SessionContext & { dealershipId: string }> {
  const ctx = await requireRole(["DEALER_ADMIN", "DEALER_AGENT", "ADMIN"]);

  if (!ctx.dealershipId) {
    throw new ForbiddenError(
      "No dealership is associated with your account.",
      "DEALERSHIP_NOT_VERIFIED"
    );
  }

  if (ctx.role !== "ADMIN" && ctx.dealershipStatus !== "VERIFIED") {
    throw new ForbiddenError(
      "Your dealership licence verification is pending or suspended.",
      "DEALERSHIP_NOT_VERIFIED"
    );
  }

  if (ctx.role !== "ADMIN" && !ctx.seatActive) {
    throw new ForbiddenError(
      "Your dealership staff seat is inactive.",
      "FORBIDDEN"
    );
  }

  if (
    allowedSeatRoles &&
    ctx.role !== "ADMIN" &&
    (!ctx.seatRole || !allowedSeatRoles.includes(ctx.seatRole))
  ) {
    throw new ForbiddenError(
      "Your dealership seat role does not permit this action.",
      "FORBIDDEN"
    );
  }

  return {
    ...ctx,
    dealershipId: ctx.dealershipId,
  };
}

/**
 * Enforces Supabase Auth AAL2 (TOTP MFA verified) for `ADMIN` and `DEALER_ADMIN`
 * accounts on sensitive privileged mutations (NFR-06, H7).
 */
export async function requireAal2ForPrivilegedRoles<
  TContext extends SessionContext,
>(ctx: TContext): Promise<TContext> {
  if (!isPrivilegedMfaRole(ctx.role, ctx.seatRole)) {
    return ctx;
  }

  const { data, error } =
    await ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const currentLevel = data?.currentLevel ?? ctx.aal ?? "aal1";
  const nextLevel =
    data?.nextLevel ?? (ctx.profile.mfa_enabled ? "aal2" : "aal1");

  if (error || currentLevel !== "aal2") {
    const reason =
      nextLevel === "aal2" ? "VERIFICATION_REQUIRED" : "ENROLLMENT_REQUIRED";
    const message =
      reason === "ENROLLMENT_REQUIRED"
        ? "Mandatory Two-Factor Authentication (TOTP) must be enrolled in Security Settings before performing privileged actions."
        : "Two-Factor Authentication (AAL2) verification is required to perform this privileged action.";

    throw new ForbiddenError(message, "MFA_REQUIRED", {
      reason,
      currentLevel,
      nextLevel,
      setupUrl: "/settings/security?mfa=enroll",
      role: ctx.role,
    });
  }

  return {
    ...ctx,
    aal: currentLevel,
  };
}
