import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { PROVINCE_CODES, type ProvinceCode } from "@/lib/canada";
import { geocodeCanadianPostalCode } from "@/lib/server/adapters/geo.adapter";
import { maskPhone, type SessionContext } from "@/lib/server/auth";
import { getPublicSupabaseEnv } from "@/lib/server/env";
import {
  BadRequestError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  AdminPlatformConfigResponse,
  AdminUserStatusResponse,
  NotificationPreferences,
  PlatformConfigItem,
  PlatformConfigKey,
  ProfileSettingsResponse,
  RelistVehicleResponse,
  SecuritySettingsResponse,
  UpdatePlatformConfigResponse,
  UpdateSecurityResponse,
} from "@/lib/types/settings";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  auctionClosing: true,
  outbidAlert: true,
  escrowDisbursement: true,
  complianceReview: true,
  emailEnabled: true,
  smsEnabled: true,
};

type ConfigSpec = {
  key: PlatformConfigKey;
  min: number;
  max: number;
  unit: string;
  fallback: number;
  description: string;
};

const PLATFORM_CONFIG_SPECS: Record<PlatformConfigKey, ConfigSpec> = {
  auction_duration_hours: {
    key: "auction_duration_hours",
    min: 1,
    max: 168,
    unit: "hours",
    fallback: 24,
    description: "Fixed duration in hours for active dealer sealed-bid auctions (BR-03)",
  },
  acceptance_window_hours: {
    key: "acceptance_window_hours",
    min: 1,
    max: 168,
    unit: "hours",
    fallback: 24,
    description: "Fixed seller in-person acceptance window in hours (BR-08)",
  },
  relist_cooldown_hours: {
    key: "relist_cooldown_hours",
    min: 0,
    max: 168,
    unit: "hours",
    fallback: 24,
    description: "Mandatory cooldown in hours before zero-bid or expired listings can relist (BR-12)",
  },
  min_photo_count: {
    key: "min_photo_count",
    min: 1,
    max: 30,
    unit: "photos",
    fallback: 8,
    description: "Minimum required vehicle photos per listing submission (FR-EU-05)",
  },
  default_radius_km: {
    key: "default_radius_km",
    min: 10,
    max: 1000,
    unit: "km",
    fallback: 100,
    description: "Default dealership notification & feed sourcing radius in km",
  },
};

const PLATFORM_CONFIG_KEYS = Object.keys(
  PLATFORM_CONFIG_SPECS
) as PlatformConfigKey[];

const ACTIVE_VIN_STATUSES: readonly Database["public"]["Enums"]["listing_status"][] =
  [
    "DRAFT",
    "PENDING_MODERATION",
    "EDITS_REQUESTED",
    "ACTIVE",
    "UNSEALED",
    "ACCEPTED",
  ];

const notificationPreferencesPatchSchema = z
  .object({
    auctionClosing: z.boolean().optional(),
    outbidAlert: z.boolean().optional(),
    escrowDisbursement: z.boolean().optional(),
    complianceReview: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
  })
  .optional();

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  phoneE164: z.string().trim().max(30).optional(),
  postalCode: z.string().trim().max(12).optional(),
  city: z.string().trim().max(120).optional(),
  province: z.enum(PROVINCE_CODES).optional(),
  languagePref: z.enum(["en", "fr"]).optional(),
  regulatorBoardId: z.string().trim().max(80).optional(),
  marketingOptIn: z.boolean().optional(),
  notificationPreferences: notificationPreferencesPatchSchema,
});

export type UpdateProfileInput = z.output<typeof updateProfileSchema>;

export const updateSecuritySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CHANGE_PASSWORD"),
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(12, "New password must be at least 12 characters.")
      .max(128, "Password cannot exceed 128 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  }),
  z.object({
    action: z.literal("REVOKE_OTHER_SESSIONS"),
  }),
]);

export type UpdateSecurityInput = z.output<typeof updateSecuritySchema>;

export const relistVehicleSchema = z.object({
  reservePriceCents: z
    .number()
    .int("Reserve price must be in integer CAD cents.")
    .min(0, "Reserve price cannot be negative.")
    .max(100_000_000, "Reserve price exceeds maximum limit.")
    .nullable()
    .optional(),
  mileageKm: z
    .number()
    .int("Mileage must be an integer.")
    .min(0)
    .max(2_000_000)
    .optional(),
  sellerNotes: z.string().trim().max(2000).optional(),
});

export type RelistVehicleInput = z.output<typeof relistVehicleSchema>;

const platformConfigKeySchema = z.enum([
  "auction_duration_hours",
  "acceptance_window_hours",
  "relist_cooldown_hours",
  "min_photo_count",
  "default_radius_km",
]);

const platformConfigUpdatesSchema = z
  .object({
    auction_duration_hours: z.number().int().optional(),
    acceptance_window_hours: z.number().int().optional(),
    relist_cooldown_hours: z.number().int().optional(),
    min_photo_count: z.number().int().optional(),
    default_radius_km: z.number().int().optional(),
  })
  .strict();

export const updatePlatformConfigSchema = z
  .object({
    updates: platformConfigUpdatesSchema.optional(),
    key: platformConfigKeySchema.optional(),
    value: z.number().int().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) =>
      (data.updates &&
        Object.values(data.updates).some((val) => val !== undefined)) ||
      (data.key !== undefined && data.value !== undefined),
    "Provide at least one platform configuration setting to update."
  );

export type UpdatePlatformConfigInput = z.output<
  typeof updatePlatformConfigSchema
>;

export const updateUserStatusSchema = z.object({
  accountStatus: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().trim().max(500).optional(),
});

export type UpdateUserStatusInput = z.output<typeof updateUserStatusSchema>;

function normalizeNotificationPrefs(
  raw: Json | null | undefined
): NotificationPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    auctionClosing:
      typeof obj.auctionClosing === "boolean"
        ? obj.auctionClosing
        : DEFAULT_NOTIFICATION_PREFS.auctionClosing,
    outbidAlert:
      typeof obj.outbidAlert === "boolean"
        ? obj.outbidAlert
        : DEFAULT_NOTIFICATION_PREFS.outbidAlert,
    escrowDisbursement:
      typeof obj.escrowDisbursement === "boolean"
        ? obj.escrowDisbursement
        : DEFAULT_NOTIFICATION_PREFS.escrowDisbursement,
    complianceReview:
      typeof obj.complianceReview === "boolean"
        ? obj.complianceReview
        : DEFAULT_NOTIFICATION_PREFS.complianceReview,
    emailEnabled:
      typeof obj.emailEnabled === "boolean"
        ? obj.emailEnabled
        : DEFAULT_NOTIFICATION_PREFS.emailEnabled,
    smsEnabled:
      typeof obj.smsEnabled === "boolean"
        ? obj.smsEnabled
        : DEFAULT_NOTIFICATION_PREFS.smsEnabled,
  };
}

function normalizeProvince(raw: string | null | undefined): ProvinceCode {
  if (raw) {
    const upper = raw.trim().toUpperCase();
    const found = PROVINCE_CODES.find((code) => code === upper);
    if (found) return found;
  }
  return "ON";
}

function normalizeAccountStatus(
  raw: string
): ProfileSettingsResponse["accountStatus"] {
  if (
    raw === "ACTIVE" ||
    raw === "SUSPENDED" ||
    raw === "PENDING_DELETION" ||
    raw === "DELETED"
  ) {
    return raw;
  }
  return "ACTIVE";
}

function toProfileResponse(
  profile: SessionContext["profile"]
): ProfileSettingsResponse {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const notifPrefs = normalizeNotificationPrefs(
    (profile as SessionContext["profile"] & { notification_preferences?: Json })
      .notification_preferences
  );

  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    fullName: fullName || profile.email,
    jobTitle: profile.job_title ?? "",
    phoneE164: profile.phone_e164 ?? "",
    postalCode: profile.postal_code ?? "",
    city: profile.city ?? "",
    province: normalizeProvince(profile.province),
    languagePref: profile.language_pref === "fr" ? "fr" : "en",
    regulatorBoardId: profile.regulator_board_id ?? "",
    role: profile.role,
    kycStatus: profile.kyc_status,
    accountStatus: normalizeAccountStatus(profile.account_status),
    marketingOptIn: profile.marketing_opt_in,
    mfaEnabled: profile.mfa_enabled,
    deletionRequestedAt: profile.deletion_requested_at ?? null,
    notificationPreferences: notifPrefs,
    serverTime: new Date().toISOString(),
  };
}

function normalizePhoneInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  throw new ValidationError("Please enter a valid Canadian phone number.", {
    phoneE164: "Enter a 10-digit North American or E.164 phone number.",
  });
}

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function summarizeUserAgent(ua: string | null): string {
  if (!ua || !ua.trim()) return "Web Browser Session";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS")
    ? "macOS"
    : ua.includes("Linux")
    ? "Linux"
    : ua.includes("iPhone") || ua.includes("iPad")
    ? "iOS"
    : "Workstation";

  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
    ? "Chrome"
    : ua.includes("Firefox/")
    ? "Firefox"
    : ua.includes("Safari/")
    ? "Safari"
    : "API Client";

  return `${os} • ${browser}`;
}

function parseIntegerConfigValue(raw: Json | undefined, fallback: number): number {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Returns the authenticated caller's live profile, regulatory metadata,
 * localization preference, and notification toggles.
 */
export async function getProfileSettings(
  ctx: SessionContext
): Promise<ProfileSettingsResponse> {
  return toProfileResponse(ctx.profile);
}

/**
 * Updates allowlisted profile fields, localization preference, CASL opt-in,
 * and granular notification toggles without permitting privilege escalation.
 */
export async function updateProfileSettings(
  ctx: SessionContext,
  input: UpdateProfileInput,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
): Promise<ProfileSettingsResponse> {
  const current = ctx.profile;
  const admin = createAdminSupabaseClient();

  let nextFirstName = current.first_name;
  let nextLastName = current.last_name;
  if (input.fullName !== undefined) {
    const split = splitFullName(input.fullName);
    nextFirstName = split.firstName;
    nextLastName = split.lastName;
  }
  if (input.firstName !== undefined) nextFirstName = input.firstName.trim();
  if (input.lastName !== undefined) nextLastName = input.lastName.trim();

  const nextPhoneE164 =
    input.phoneE164 !== undefined
      ? normalizePhoneInput(input.phoneE164) || null
      : current.phone_e164;

  let nextProvince = normalizeProvince(input.province ?? current.province);
  let nextPostalCode = current.postal_code;
  let nextCity =
    input.city !== undefined ? input.city.trim() : current.city ?? "";
  let nextLocation: unknown = current.location;

  if (input.postalCode !== undefined && input.postalCode.trim().length > 0) {
    const geo = await geocodeCanadianPostalCode(input.postalCode, {
      preferredProvince: input.province ?? nextProvince,
      preferredCity: input.city !== undefined ? input.city : nextCity || undefined,
    });
    nextPostalCode = geo.postalCode;
    nextProvince = input.province ?? geo.province;
    nextCity =
      input.city !== undefined && input.city.trim().length > 0
        ? input.city.trim()
        : geo.city;
    nextLocation = geo.locationWkt;
  } else if (input.province !== undefined && input.province !== current.province) {
    // Re-center location onto the newly selected province without overriding explicit province back to old FSA
    const geo = await geocodeCanadianPostalCode("", {
      preferredProvince: input.province,
      preferredCity: input.city !== undefined ? input.city : nextCity || undefined,
    });
    nextLocation = geo.locationWkt;
    if (input.city === undefined && !nextCity) {
      nextCity = geo.city;
    }
  }

  const currentPrefs = normalizeNotificationPrefs(
    (current as SessionContext["profile"] & { notification_preferences?: Json })
      .notification_preferences
  );
  const nextPrefs: NotificationPreferences = {
    ...currentPrefs,
    ...(input.notificationPreferences ?? {}),
  };

  const nextLanguagePref = input.languagePref ?? (current.language_pref === "fr" ? "fr" : "en");
  const nextJobTitle =
    input.jobTitle !== undefined
      ? input.jobTitle.trim() || null
      : current.job_title;
  const nextRegulatorBoardId =
    input.regulatorBoardId !== undefined
      ? input.regulatorBoardId.trim() || null
      : current.regulator_board_id;
  const nextMarketingOptIn =
    input.marketingOptIn !== undefined
      ? input.marketingOptIn
      : current.marketing_opt_in;

  const { data: updated, error: updateErr } = await admin
    .from("profiles")
    .update({
      first_name: nextFirstName,
      last_name: nextLastName,
      job_title: nextJobTitle,
      phone_e164: nextPhoneE164,
      postal_code: nextPostalCode,
      city: nextCity,
      province: nextProvince,
      location: nextLocation,
      language_pref: nextLanguagePref,
      regulator_board_id: nextRegulatorBoardId,
      marketing_opt_in: nextMarketingOptIn,
      notification_preferences: nextPrefs as unknown as Json,
    })
    .eq("id", ctx.userId)
    .select("*")
    .single();

  if (updateErr || !updated) {
    throw new ExternalServiceError(
      "Unable to save profile settings.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  const actorName =
    `${updated.first_name} ${updated.last_name}`.trim() || ctx.email;

  await Promise.all([
    ...(input.marketingOptIn !== undefined &&
    input.marketingOptIn !== current.marketing_opt_in
      ? [
          admin.from("user_consents").insert({
            user_id: ctx.userId,
            consent_type: "CASL_MARKETING",
            granted: nextMarketingOptIn,
            policy_version: "1.0",
            ip_address: requestMeta.ipAddress,
            user_agent: requestMeta.userAgent,
          }),
        ]
      : []),
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "PROFILE_SETTINGS_UPDATED",
      entity_type: "profile",
      entity_id: ctx.userId,
      provincial_jurisdiction: updated.province ?? "ON",
      ip_address: requestMeta.ipAddress,
      details: "Updated user profile preferences and notification settings",
      before_json: {
        province: current.province,
        city: current.city,
        language_pref: current.language_pref,
        job_title: current.job_title,
        marketing_opt_in: current.marketing_opt_in,
      },
      after_json: {
        province: updated.province,
        city: updated.city,
        language_pref: updated.language_pref,
        job_title: updated.job_title,
        marketing_opt_in: updated.marketing_opt_in,
      },
    }),
  ]);

  return toProfileResponse(updated);
}

/**
 * Returns security posture, AAL telemetry, and current session metadata.
 */
export async function getSecuritySettings(
  ctx: SessionContext,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
): Promise<SecuritySettingsResponse> {
  const [userRes, aalRes, factorsRes] = await Promise.all([
    ctx.supabase.auth.getUser(),
    ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ctx.supabase.auth.mfa.listFactors(),
  ]);

  const user = userRes.data.user;
  const verifiedTotpCount = (factorsRes.data?.totp ?? []).length;
  const liveMfaEnabled = factorsRes.error
    ? ctx.profile.mfa_enabled
    : verifiedTotpCount > 0;

  return {
    email: ctx.email,
    mfaEnabled: liveMfaEnabled,
    aal: aalRes.data?.currentLevel ?? ctx.aal ?? "aal1",
    role: ctx.role,
    emailVerified: ctx.profile.email_verified,
    phoneVerified: ctx.profile.phone_verified,
    phoneMasked: maskPhone(ctx.profile.phone_e164),
    currentSession: {
      userAgentSummary: summarizeUserAgent(requestMeta.userAgent),
      ipAddress: requestMeta.ipAddress ?? "Session IP Verified",
      lastSignInAt: user?.last_sign_in_at ?? null,
    },
    serverTime: new Date().toISOString(),
  };
}

/**
 * Handles password rotation (verifying the current password via stateless
 * signInWithPassword) or revoking all other active user sessions.
 */
export async function updateSecuritySettings(
  ctx: SessionContext,
  input: UpdateSecurityInput,
  requestMeta: { ipAddress: string | null }
): Promise<UpdateSecurityResponse> {
  const admin = createAdminSupabaseClient();
  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;
  const nowIso = new Date().toISOString();

  if (input.action === "CHANGE_PASSWORD") {
    if (input.newPassword !== input.confirmPassword) {
      throw new ValidationError("Passwords do not match.", {
        confirmPassword: "Confirmation must match your new password.",
      });
    }

    if (input.newPassword === input.currentPassword) {
      throw new ValidationError(
        "New password must differ from your current password.",
        {
          newPassword: "Choose a password different from your current one.",
        }
      );
    }

    const hasUpper = /[A-Z]/.test(input.newPassword);
    const hasLower = /[a-z]/.test(input.newPassword);
    const hasDigit = /\d/.test(input.newPassword);
    if (!hasUpper || !hasLower || !hasDigit) {
      throw new ValidationError(
        "Password does not meet complexity requirements.",
        {
          newPassword:
            "Include uppercase letters, lowercase letters, and at least one number.",
        }
      );
    }

    const { url, publishableKey } = getPublicSupabaseEnv();
    const statelessClient = createClient<Database>(
      url,
      publishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { error: verifyErr } = await statelessClient.auth.signInWithPassword({
      email: ctx.email,
      password: input.currentPassword,
    });

    if (verifyErr) {
      throw new ValidationError("Current password is incorrect.", {
        currentPassword: "The current password provided is incorrect.",
      });
    }

    const { error: pwdUpdateErr } = await admin.auth.admin.updateUserById(
      ctx.userId,
      { password: input.newPassword }
    );

    if (pwdUpdateErr) {
      throw new ExternalServiceError(
        "Unable to update password at this time.",
        "EXTERNAL_SERVICE_ERROR",
        pwdUpdateErr
      );
    }

    await admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "PASSWORD_CHANGED",
      entity_type: "auth_user",
      entity_id: ctx.userId,
      provincial_jurisdiction: ctx.profile.province ?? "ON",
      ip_address: requestMeta.ipAddress,
      details: "Account password rotated via authenticated security settings",
      after_json: { passwordRotatedAt: nowIso },
    });

    return {
      action: "CHANGE_PASSWORD",
      message: "Your password has been updated securely.",
      auditAction: "PASSWORD_CHANGED",
      serverTime: nowIso,
    };
  }

  const { error: signOutErr } = await ctx.supabase.auth.signOut({
    scope: "others",
  });

  if (signOutErr) {
    throw new ExternalServiceError(
      "Unable to revoke other sessions at this time.",
      "EXTERNAL_SERVICE_ERROR",
      signOutErr
    );
  }

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "OTHER_SESSIONS_REVOKED",
    entity_type: "auth_user",
    entity_id: ctx.userId,
    provincial_jurisdiction: ctx.profile.province ?? "ON",
    ip_address: requestMeta.ipAddress,
    details: "Revoked all other active sessions for this user account",
    after_json: { revokedOtherSessionsAt: nowIso },
  });

  return {
    action: "REVOKE_OTHER_SESSIONS",
    message: "All other active sessions have been signed out.",
    auditAction: "OTHER_SESSIONS_REVOKED",
    serverTime: nowIso,
  };
}

/**
 * Relists an eligible EXPIRED, CANCELLED, or zero-bid UNSEALED vehicle into
 * a fresh PENDING_MODERATION child listing after enforcing the dynamic
 * `relist_cooldown_hours` rule from `platform_config` (FR-EU-13, BR-12).
 */
export async function relistVehicle(
  ctx: SessionContext,
  listingId: string,
  input: RelistVehicleInput,
  requestMeta: { ipAddress: string | null }
): Promise<RelistVehicleResponse> {
  if (!UUID_REGEX.test(listingId)) {
    throw new BadRequestError("Invalid listing identifier.");
  }

  const admin = createAdminSupabaseClient();

  const { data: parent, error: parentErr } = await admin
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (parentErr) {
    throw new ExternalServiceError(
      "Unable to load listing for relisting.",
      "EXTERNAL_SERVICE_ERROR",
      parentErr
    );
  }

  if (!parent) {
    throw new NotFoundError("Vehicle listing not found.");
  }

  if (ctx.role !== "ADMIN" && parent.seller_id !== ctx.userId) {
    throw new ForbiddenError(
      "Only the vehicle owner may relist this vehicle."
    );
  }

  if (ctx.role !== "ADMIN" && ctx.kycStatus !== "VERIFIED") {
    throw new ForbiddenError(
      "Government ID verification (KYC) must be verified before relisting.",
      "KYC_REQUIRED"
    );
  }

  const { data: existingMatch } = await admin
    .from("matches")
    .select("id, outcome")
    .eq("listing_id", parent.id)
    .maybeSingle();

  const hasActiveOrCompletedMatch =
    existingMatch !== null &&
    (existingMatch.outcome === "APPOINTMENT_CONFIRMED" ||
      existingMatch.outcome === "COMPLETED" ||
      existingMatch.outcome === "RENEGOTIATED_LOWER");

  const isEligibleStatus =
    parent.status === "EXPIRED" ||
    parent.status === "CANCELLED" ||
    (parent.status === "UNSEALED" &&
      parent.bid_count === 0 &&
      !hasActiveOrCompletedMatch);

  if (!isEligibleStatus) {
    throw new ConflictError(
      `Listings in status ${parent.status} with ${parent.bid_count} bids cannot be relisted.`,
      "LISTING_NOT_ELIGIBLE_FOR_RELIST",
      {
        status: parent.status,
        bidCount: parent.bid_count,
      }
    );
  }

  // Dynamically enforce FR-EU-13 / BR-12 cooldown from platform_config
  const { data: cooldownRow } = await admin
    .from("platform_config")
    .select("value_json")
    .eq("key", "relist_cooldown_hours")
    .maybeSingle();

  const cooldownHours = Math.max(
    0,
    parseIntegerConfigValue(
      cooldownRow?.value_json,
      PLATFORM_CONFIG_SPECS.relist_cooldown_hours.fallback
    )
  );

  const referenceIso =
    parent.closed_at ??
    parent.auction_ends_at ??
    parent.updated_at ??
    parent.created_at;
  const referenceMs = new Date(referenceIso).getTime();
  const eligibleAtMs = referenceMs + cooldownHours * 3_600_000;
  const nowMs = Date.now();

  if (cooldownHours > 0 && nowMs < eligibleAtMs) {
    const remainingMinutes = Math.max(
      1,
      Math.ceil((eligibleAtMs - nowMs) / 60_000)
    );
    const eligibleAt = new Date(eligibleAtMs).toISOString();
    throw new ConflictError(
      `Relisting requires a ${cooldownHours}-hour cooldown after auction close. Available again in ${remainingMinutes} minutes.`,
      "RELIST_COOLDOWN_ACTIVE",
      {
        cooldownHours,
        eligibleAt,
        remainingMinutes,
      }
    );
  }

  // Ensure no other active listing holds this VIN before relisting
  const { data: otherActiveVin } = await admin
    .from("listings")
    .select("id")
    .ilike("vin", parent.vin)
    .neq("id", parent.id)
    .in("status", ACTIVE_VIN_STATUSES)
    .maybeSingle();

  if (otherActiveVin) {
    throw new ConflictError(
      "Another active listing already exists for this VIN.",
      "ACTIVE_VIN_EXISTS",
      { vin: parent.vin }
    );
  }

  const nowIso = new Date().toISOString();

  // Transition zero-bid UNSEALED parent to EXPIRED first so BR-02 uniq_listings_active_vin allows child insert
  let finalParentStatus: "EXPIRED" | "CANCELLED" =
    parent.status === "CANCELLED" ? "CANCELLED" : "EXPIRED";

  if (parent.status === "UNSEALED") {
    const { error: expireParentErr } = await admin
      .from("listings")
      .update({
        status: "EXPIRED",
        closed_at: parent.closed_at ?? nowIso,
      })
      .eq("id", parent.id)
      .eq("status", "UNSEALED");

    if (expireParentErr) {
      throw new ExternalServiceError(
        "Unable to finalize previous auction prior to relist.",
        "EXTERNAL_SERVICE_ERROR",
        expireParentErr
      );
    }
    finalParentStatus = "EXPIRED";
  }

  const nextRelistCount = parent.relist_count + 1;
  const nextReserveCents =
    input.reservePriceCents !== undefined
      ? input.reservePriceCents ?? 0
      : parent.reserve_price_cents ?? 0;

  const { data: childListing, error: insertChildErr } = await admin
    .from("listings")
    .insert({
      seller_id: parent.seller_id,
      parent_listing_id: parent.id,
      relist_count: nextRelistCount,
      vin: parent.vin,
      year: parent.year,
      make: parent.make,
      model: parent.model,
      trim: parent.trim,
      body_type: parent.body_type,
      engine_spec: parent.engine_spec,
      horsepower: parent.horsepower,
      fuel_type: parent.fuel_type,
      mileage_km: input.mileageKm ?? parent.mileage_km,
      transmission: parent.transmission,
      drivetrain: parent.drivetrain,
      exterior_color: parent.exterior_color,
      interior_color: parent.interior_color,
      keys_count: parent.keys_count,
      accident_declaration: parent.accident_declaration,
      accident_count: parent.accident_count,
      accident_details: parent.accident_details,
      has_lien: parent.has_lien,
      lien_details: parent.lien_details,
      service_history_notes: parent.service_history_notes,
      tire_condition: parent.tire_condition,
      seller_notes: input.sellerNotes ?? parent.seller_notes,
      vin_decoded_json: parent.vin_decoded_json,
      manual_edits_json: parent.manual_edits_json,
      carfax_clean: parent.carfax_clean,
      carfax_summary_json: parent.carfax_summary_json,
      damage_grade: parent.damage_grade,
      damage_hotspot_count: parent.damage_hotspot_count,
      postal_code: parent.postal_code,
      city: parent.city,
      province: parent.province,
      location: parent.location,
      reserve_price_cents: nextReserveCents,
      status: "PENDING_MODERATION",
      bid_count: 0,
      declaration_owner_attested: parent.declaration_owner_attested,
      declaration_accurate_condition: parent.declaration_accurate_condition,
      declaration_no_unpaid_fines: parent.declaration_no_unpaid_fines,
    })
    .select("*")
    .single();

  if (insertChildErr || !childListing) {
    throw new ExternalServiceError(
      "Unable to create relisted vehicle record.",
      "EXTERNAL_SERVICE_ERROR",
      insertChildErr
    );
  }

  const [mediaRes, hotspotRes] = await Promise.all([
    admin
      .from("listing_media")
      .select("*")
      .eq("listing_id", parent.id)
      .order("sort_order", { ascending: true }),
    admin.from("damage_hotspots").select("*").eq("listing_id", parent.id),
  ]);

  const parentMedia = mediaRes.data ?? [];
  const parentHotspots = hotspotRes.data ?? [];

  if (parentMedia.length > 0) {
    const { error: cloneMediaErr } = await admin.from("listing_media").insert(
      parentMedia.map((m) => ({
        listing_id: childListing.id,
        storage_key: m.storage_key,
        public_url: m.public_url,
        file_name: m.file_name,
        file_size_bytes: m.file_size_bytes,
        mime_type: m.mime_type,
        photo_label: m.photo_label,
        is_cover: m.is_cover,
        sort_order: m.sort_order,
      }))
    );
    if (cloneMediaErr) {
      throw new ExternalServiceError(
        "Unable to clone vehicle photos for relist.",
        "EXTERNAL_SERVICE_ERROR",
        cloneMediaErr
      );
    }
  }

  if (parentHotspots.length > 0) {
    const { error: cloneHotspotsErr } = await admin
      .from("damage_hotspots")
      .insert(
        parentHotspots.map((h) => ({
          listing_id: childListing.id,
          viewpoint: h.viewpoint,
          x_percent: h.x_percent,
          y_percent: h.y_percent,
          panel: h.panel,
          severity: h.severity,
          description: h.description,
          photo_storage_key: h.photo_storage_key,
          photo_url: h.photo_url,
        }))
      );
    if (cloneHotspotsErr) {
      throw new ExternalServiceError(
        "Unable to clone damage disclosures for relist.",
        "EXTERNAL_SERVICE_ERROR",
        cloneHotspotsErr
      );
    }
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await Promise.all([
    admin.from("notifications").insert({
      user_id: parent.seller_id,
      type: "MODERATION",
      title: "Relisted vehicle submitted for review",
      description: `${childListing.year} ${childListing.make} ${childListing.model} (relist #${nextRelistCount}) is queued for AutoNexa verification.`,
      listing_id: childListing.id,
      metadata: {
        parentListingId: parent.id,
        relistCount: nextRelistCount,
      },
    }),
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "LISTING_RELISTED",
      entity_type: "listing",
      entity_id: childListing.id,
      provincial_jurisdiction: childListing.province,
      ip_address: requestMeta.ipAddress,
      details: `Relisted ${childListing.year} ${childListing.make} ${childListing.model} (${childListing.vin}) from parent ${parent.id} (relist #${nextRelistCount})`,
      before_json: {
        parentListingId: parent.id,
        parentStatus: parent.status,
        reservePriceCents: parent.reserve_price_cents,
      },
      after_json: {
        childListingId: childListing.id,
        status: childListing.status,
        relistCount: nextRelistCount,
        reservePriceCents: childListing.reserve_price_cents,
      },
    }),
  ]);

  const coverUrl =
    parentMedia.find((m) => m.is_cover)?.public_url ??
    parentMedia[0]?.public_url ??
    DEFAULT_THUMBNAIL;

  return {
    listing: {
      id: childListing.id,
      vin: childListing.vin,
      year: childListing.year,
      make: childListing.make,
      model: childListing.model,
      trim: childListing.trim,
      mileageKm: childListing.mileage_km,
      status: (childListing as ListingRow).status,
      reservePriceCents: childListing.reserve_price_cents ?? 0,
      coverPhotoUrl: coverUrl,
      photoCount: parentMedia.length,
      hotspotCount: parentHotspots.length,
      createdAt: childListing.created_at,
      auctionEndsAt: childListing.auction_ends_at,
      message: "Vehicle relisted and queued for AutoNexa moderation review.",
    },
    parentListingId: parent.id,
    parentStatus: finalParentStatus,
    relistCount: nextRelistCount,
    message: `Vehicle relisted successfully (attempt #${nextRelistCount}).`,
    serverTime: nowIso,
  };
}

function hydrateConfigItems(
  rows: ReadonlyArray<{
    key: string;
    value_json: Json;
    description: string | null;
    updated_at: string;
    updated_by: string | null;
  }>
): AdminPlatformConfigResponse {
  const rowMap = new Map(rows.map((r) => [r.key, r]));
  const items: PlatformConfigItem[] = [];
  const values = {} as Record<PlatformConfigKey, number>;

  for (const key of PLATFORM_CONFIG_KEYS) {
    const spec = PLATFORM_CONFIG_SPECS[key];
    const row = rowMap.get(key);
    const val = parseIntegerConfigValue(row?.value_json, spec.fallback);
    values[key] = val;
    items.push({
      key,
      value: val,
      min: spec.min,
      max: spec.max,
      unit: spec.unit,
      description: row?.description ?? spec.description,
      updatedAt: row?.updated_at ?? new Date().toISOString(),
      updatedBy: row?.updated_by ?? null,
    });
  }

  return {
    items,
    values,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Loads all runtime platform configuration thresholds (FR-AD-08).
 */
export async function getPlatformConfig(
  ctx: SessionContext
): Promise<AdminPlatformConfigResponse> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators may view platform configuration."
    );
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("platform_config")
    .select("key, value_json, description, updated_at, updated_by")
    .order("key", { ascending: true });

  if (error) {
    throw new ExternalServiceError(
      "Unable to load platform configuration.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  return hydrateConfigItems(data ?? []);
}

/**
 * Updates allowlisted numeric thresholds in `platform_config` with strict bounds
 * validation and immutable `audit_logs` tracking (FR-AD-08).
 */
export async function updatePlatformConfig(
  ctx: SessionContext,
  input: UpdatePlatformConfigInput,
  requestMeta: { ipAddress: string | null }
): Promise<UpdatePlatformConfigResponse> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators may modify platform configuration."
    );
  }

  const mergedUpdates: Partial<Record<PlatformConfigKey, number>> = {
    ...(input.updates ?? {}),
  };
  if (input.key !== undefined && input.value !== undefined) {
    mergedUpdates[input.key] = input.value;
  }

  const fieldErrors: Record<string, string> = {};
  for (const [k, rawVal] of Object.entries(mergedUpdates)) {
    const key = k as PlatformConfigKey;
    const spec = PLATFORM_CONFIG_SPECS[key];
    if (!spec || typeof rawVal !== "number" || !Number.isInteger(rawVal)) {
      fieldErrors[k] = "Invalid configuration setting.";
      continue;
    }
    if (rawVal < spec.min || rawVal > spec.max) {
      fieldErrors[k] = `Must be between ${spec.min} and ${spec.max} ${spec.unit}.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError(
      "One or more configuration values are out of range.",
      fieldErrors
    );
  }

  const admin = createAdminSupabaseClient();
  const { data: beforeRows, error: beforeErr } = await admin
    .from("platform_config")
    .select("key, value_json, description, updated_at, updated_by");

  if (beforeErr) {
    throw new ExternalServiceError(
      "Unable to read existing configuration.",
      "EXTERNAL_SERVICE_ERROR",
      beforeErr
    );
  }

  const beforeState = hydrateConfigItems(beforeRows ?? []);
  const entries = Object.entries(mergedUpdates) as Array<
    [PlatformConfigKey, number]
  >;

  const upsertRows = entries.map(([key, value]) => ({
    key,
    value_json: value as unknown as Json,
    description: PLATFORM_CONFIG_SPECS[key].description,
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertErr } = await admin
    .from("platform_config")
    .upsert(upsertRows, { onConflict: "key" });

  if (upsertErr) {
    throw new ExternalServiceError(
      "Unable to save platform configuration updates.",
      "EXTERNAL_SERVICE_ERROR",
      upsertErr
    );
  }

  const { data: afterRows, error: afterErr } = await admin
    .from("platform_config")
    .select("key, value_json, description, updated_at, updated_by")
    .order("key", { ascending: true });

  if (afterErr) {
    throw new ExternalServiceError(
      "Platform config updated but reload failed.",
      "EXTERNAL_SERVICE_ERROR",
      afterErr
    );
  }

  const refreshed = hydrateConfigItems(afterRows ?? []);
  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "PLATFORM_CONFIG_UPDATED",
    entity_type: "platform_config",
    entity_id: entries.map(([k]) => k).join(","),
    provincial_jurisdiction: ctx.profile.province ?? "ON",
    ip_address: requestMeta.ipAddress,
    details:
      input.reason?.trim() ||
      `Updated platform config keys: ${entries
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    before_json: beforeState.values as unknown as Json,
    after_json: refreshed.values as unknown as Json,
  });

  return {
    ...refreshed,
    auditAction: "PLATFORM_CONFIG_UPDATED",
    message: "Platform configuration updated and active immediately.",
  };
}

/**
 * Allows an Admin to suspend or reactivate a user account with immediate enforcement
 * in `requireAuth()` and immutable audit logging (FR-AD-01).
 */
export async function updateUserAccountStatus(
  ctx: SessionContext,
  targetUserId: string,
  input: UpdateUserStatusInput,
  requestMeta: { ipAddress: string | null }
): Promise<AdminUserStatusResponse> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators may change user account status."
    );
  }

  if (!UUID_REGEX.test(targetUserId)) {
    throw new BadRequestError("Invalid user identifier.");
  }

  if (targetUserId === ctx.userId) {
    throw new BadRequestError(
      "Administrators cannot suspend or modify their own account status."
    );
  }

  const admin: AdminClient = createAdminSupabaseClient();
  const { data: target, error: loadErr } = await admin
    .from("profiles")
    .select("id, email, role, account_status, province")
    .eq("id", targetUserId)
    .maybeSingle();

  if (loadErr) {
    throw new ExternalServiceError(
      "Unable to look up target user account.",
      "EXTERNAL_SERVICE_ERROR",
      loadErr
    );
  }

  if (!target) {
    throw new NotFoundError("Target user profile not found.");
  }

  const { data: updated, error: updateErr } = await admin
    .from("profiles")
    .update({ account_status: input.accountStatus })
    .eq("id", targetUserId)
    .select("id, email, role, account_status")
    .single();

  if (updateErr || !updated) {
    throw new ExternalServiceError(
      "Unable to update user account status.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "USER_STATUS_UPDATED",
    entity_type: "profile",
    entity_id: targetUserId,
    provincial_jurisdiction: target.province ?? "ON",
    ip_address: requestMeta.ipAddress,
    details:
      input.reason?.trim() ||
      `Changed account_status for ${target.email} from ${target.account_status} to ${input.accountStatus}`,
    before_json: { accountStatus: target.account_status },
    after_json: { accountStatus: input.accountStatus },
  });

  return {
    userId: updated.id,
    email: updated.email,
    role: updated.role,
    accountStatus: input.accountStatus,
    auditAction: "USER_STATUS_UPDATED",
    message: `Account ${updated.email} is now ${input.accountStatus}.`,
    serverTime: new Date().toISOString(),
  };
}
