import type { Factor } from "@supabase/supabase-js";
import { z } from "zod";
import {
  isPrivilegedMfaRole,
  toSessionUser,
  type SessionContext,
} from "@/lib/server/auth";
import {
  ExternalServiceError,
  ForbiddenError,
  ValidationError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  MfaEnrollResponse,
  MfaFactorSummary,
  MfaFactorsResponse,
  MfaUnenrollResponse,
  MfaVerifyResponse,
} from "@/lib/types/auth";

export const enrollTotpSchema = z.object({
  friendlyName: z
    .string()
    .trim()
    .min(2, "Device name must be at least 2 characters.")
    .max(60, "Device name cannot exceed 60 characters.")
    .optional(),
});

export const verifyTotpSchema = z.object({
  factorId: z.string().uuid("Invalid authenticator factor identifier."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});

export const unenrollTotpSchema = z.object({
  factorId: z.string().uuid("Invalid authenticator factor identifier."),
});

export type EnrollTotpInput = z.output<typeof enrollTotpSchema>;
export type VerifyTotpInput = z.output<typeof verifyTotpSchema>;
export type UnenrollTotpInput = z.output<typeof unenrollTotpSchema>;

function normalizeAal(raw: string | null | undefined): "aal1" | "aal2" | null {
  if (raw === "aal1" || raw === "aal2") return raw;
  return null;
}

export function mapFactorToSummary(factor: Factor): MfaFactorSummary {
  const factorType =
    factor.factor_type === "phone" || factor.factor_type === "webauthn"
      ? factor.factor_type
      : "totp";
  return {
    id: factor.id,
    friendlyName: factor.friendly_name?.trim() || "Authenticator App",
    factorType,
    status: factor.status === "verified" ? "verified" : "unverified",
    createdAt: factor.created_at,
    updatedAt: factor.updated_at,
  };
}

function normalizeQrDataUri(rawQrCode: string): string {
  const trimmed = rawQrCode.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  return `data:image/svg+xml;utf-8,${encodeURIComponent(trimmed)}`;
}

async function syncProfileMfaFlag(
  userId: string,
  currentDbFlag: boolean,
  hasVerifiedFactor: boolean
): Promise<boolean> {
  if (currentDbFlag === hasVerifiedFactor) {
    return currentDbFlag;
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("profiles")
    .update({ mfa_enabled: hasVerifiedFactor })
    .eq("id", userId);

  if (error) {
    logger.warn("Unable to synchronize profiles.mfa_enabled flag", {
      actorId: userId,
      meta: { hasVerifiedFactor, error },
    });
    return currentDbFlag;
  }

  return hasVerifiedFactor;
}

/**
 * Lists the caller's TOTP MFA factors and live Supabase AAL1/AAL2 status,
 * keeping `profiles.mfa_enabled` consistent with verified factors.
 */
export async function listUserMfaFactors(
  ctx: SessionContext
): Promise<MfaFactorsResponse> {
  const [factorsRes, aalRes] = await Promise.all([
    ctx.supabase.auth.mfa.listFactors(),
    ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (factorsRes.error) {
    throw new ExternalServiceError(
      "Unable to load MFA authenticator factors.",
      "EXTERNAL_SERVICE_ERROR",
      factorsRes.error
    );
  }

  const totpFactors = (factorsRes.data?.all ?? [])
    .filter((f) => f.factor_type === "totp")
    .map(mapFactorToSummary);

  const hasVerified = totpFactors.some((f) => f.status === "verified");
  const mfaEnabled = await syncProfileMfaFlag(
    ctx.userId,
    ctx.profile.mfa_enabled,
    hasVerified
  );

  return {
    currentLevel: normalizeAal(aalRes.data?.currentLevel ?? ctx.aal),
    nextLevel: normalizeAal(
      aalRes.data?.nextLevel ?? (hasVerified ? "aal2" : "aal1")
    ),
    mfaRequiredForRole: isPrivilegedMfaRole(ctx.role, ctx.seatRole),
    mfaEnabled,
    factors: totpFactors,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Enrolls a new TOTP authenticator factor via native Supabase Auth MFA (`mfa.enroll`),
 * cleaning up stale unverified enrollments so retries stay conflict-free (NFR-06).
 */
export async function enrollTotpFactor(
  ctx: SessionContext,
  input: EnrollTotpInput,
  requestMeta: { ipAddress: string | null }
): Promise<MfaEnrollResponse> {
  const existingRes = await ctx.supabase.auth.mfa.listFactors();
  if (!existingRes.error && existingRes.data?.all) {
    const staleUnverified = existingRes.data.all.filter(
      (f) => f.factor_type === "totp" && f.status === "unverified"
    );
    for (const stale of staleUnverified) {
      await ctx.supabase.auth.mfa.unenroll({ factorId: stale.id });
    }
  }

  const baseName = input.friendlyName?.trim() || "AutoNexa Authenticator";
  const friendlyName =
    existingRes.data?.totp && existingRes.data.totp.length > 0
      ? `${baseName} (${existingRes.data.totp.length + 1})`
      : baseName;

  const { data, error } = await ctx.supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "AutoNexa Canada",
    friendlyName,
  });

  if (error || !data) {
    throw new ExternalServiceError(
      error?.message || "Unable to initiate TOTP authenticator enrollment.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const admin = createAdminSupabaseClient();
  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "MFA_ENROLLMENT_STARTED",
    entity_type: "profile",
    entity_id: ctx.userId,
    ip_address: requestMeta.ipAddress,
    provincial_jurisdiction: ctx.profile.province,
    after_json: {
      factorId: data.id,
      friendlyName: data.friendly_name ?? friendlyName,
      factorType: "totp",
    },
    details: "Started TOTP authenticator factor enrollment",
  });

  // Never log `secret` or `uri` to server logs or audit_logs.
  return {
    factorId: data.id,
    friendlyName: data.friendly_name ?? friendlyName,
    qrCode: normalizeQrDataUri(data.totp.qr_code),
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/**
 * Verifies a 6-digit TOTP authenticator code via `challengeAndVerify()`, upgrading
 * the `@supabase/ssr` session cookies to `aal2` and marking `profiles.mfa_enabled = true`.
 */
export async function verifyTotpFactor(
  ctx: SessionContext,
  input: VerifyTotpInput,
  requestMeta: { ipAddress: string | null }
): Promise<MfaVerifyResponse> {
  const { data, error } = await ctx.supabase.auth.mfa.challengeAndVerify({
    factorId: input.factorId,
    code: input.code,
  });

  if (error || !data) {
    throw new ValidationError(
      "That verification code is invalid or has expired.",
      {
        code: "Invalid or expired 6-digit authenticator code.",
      }
    );
  }

  const admin = createAdminSupabaseClient();
  const { data: updatedProfile } = await admin
    .from("profiles")
    .update({ mfa_enabled: true })
    .eq("id", ctx.userId)
    .select("*")
    .maybeSingle();

  const resolvedProfile = updatedProfile ?? {
    ...ctx.profile,
    mfa_enabled: true,
  };
  const actorName =
    `${resolvedProfile.first_name} ${resolvedProfile.last_name}`.trim() ||
    ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "MFA_TOTP_VERIFIED",
    entity_type: "profile",
    entity_id: ctx.userId,
    ip_address: requestMeta.ipAddress,
    provincial_jurisdiction: resolvedProfile.province,
    after_json: {
      factorId: input.factorId,
      currentLevel: "aal2",
      mfaEnabled: true,
    },
    details: "Verified TOTP factor and elevated session to AAL2",
  });

  return {
    verified: true,
    factorId: input.factorId,
    currentLevel: "aal2",
    session: {
      accessToken: data.access_token,
      user: toSessionUser(resolvedProfile),
      aal: "aal2",
      nextAal: "aal2",
      mfaRequired: false,
      mfaEnrollmentRequired: false,
    },
  };
}

/**
 * Removes an enrolled TOTP factor via `supabase.auth.mfa.unenroll()` and syncs
 * `profiles.mfa_enabled`. Supabase enforces `aal2` before removing verified factors.
 */
export async function unenrollTotpFactor(
  ctx: SessionContext,
  input: UnenrollTotpInput,
  requestMeta: { ipAddress: string | null }
): Promise<MfaUnenrollResponse> {
  const { error } = await ctx.supabase.auth.mfa.unenroll({
    factorId: input.factorId,
  });

  if (error) {
    if (error.message.toLowerCase().includes("aal2")) {
      throw new ForbiddenError(
        "Verify your active TOTP authenticator (AAL2) before removing this security factor.",
        "MFA_REQUIRED",
        {
          reason: "VERIFICATION_REQUIRED",
          setupUrl: "/settings/security",
        }
      );
    }

    throw new ExternalServiceError(
      error.message || "Unable to remove TOTP factor.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const listAfter = await ctx.supabase.auth.mfa.listFactors();
  const hasVerifiedRemaining = (listAfter.data?.totp ?? []).length > 0;

  const admin = createAdminSupabaseClient();
  await admin
    .from("profiles")
    .update({ mfa_enabled: hasVerifiedRemaining })
    .eq("id", ctx.userId);

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "MFA_FACTOR_REMOVED",
    entity_type: "profile",
    entity_id: ctx.userId,
    ip_address: requestMeta.ipAddress,
    provincial_jurisdiction: ctx.profile.province,
    after_json: {
      removedFactorId: input.factorId,
      mfaEnabled: hasVerifiedRemaining,
    },
    details: "Removed TOTP authenticator factor from account",
  });

  return {
    unenrolled: true,
    factorId: input.factorId,
    mfaEnabled: hasVerifiedRemaining,
  };
}
