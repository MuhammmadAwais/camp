import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  getSessionContext,
  maskPhone,
  requireAuth,
  toSessionUser,
  type ProfileRow,
} from "@/lib/server/auth";
import { getPublicSupabaseEnv, getServerEnv } from "@/lib/server/env";
import {
  AppError,
  BadRequestError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import type { LoginPayload, RegisterPayload } from "@/lib/schemas/auth-schema";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AuthSession,
  ForgotPasswordResponse,
  PendingVerification,
  ResendCodeResponse,
  SessionUser,
  UserRole,
  VerificationChannel,
  VerifyContactResponse,
} from "@/lib/types/auth";

export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
const CHALLENGE_TTL_MS = 30 * 60 * 1000;
const SANDBOX_OTP_CODE = "000000";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type ChallengeRow = Database["public"]["Tables"]["auth_challenges"]["Row"];
type RegulatorCode = Database["public"]["Enums"]["regulator_code"];
type ConsentType = "PIPEDA_PRIVACY" | "LAW25_PRIVACY" | "TERMS_OF_SERVICE" | "CASL_MARKETING";

const REGULATOR_CODES: readonly RegulatorCode[] = [
  "OMVIC",
  "AMVIC",
  "VSA",
  "OPC",
];

const DEMO_ACCOUNTS_BY_ROLE: Record<UserRole, string> = {
  SELLER: "seller@autonexa.ca",
  DEALER_ADMIN: "dealer@autonexa.ca",
  DEALER_AGENT: "agent@autonexa.ca",
  ADMIN: "admin@autonexa.ca",
};

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "••••";
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}${domain}`;
}

function toPendingVerification(
  registrationId: string,
  profile: ProfileRow
): PendingVerification {
  return {
    registrationId,
    emailMasked: maskEmail(profile.email),
    phoneMasked: maskPhone(profile.phone_e164),
    emailVerified: profile.email_verified,
    phoneVerified: profile.phone_verified,
  };
}

function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

function hashOtp(
  userId: string,
  channel: VerificationChannel,
  code: string
): string {
  const { supabaseSecretKey } = getServerEnv();
  return createHmac("sha256", supabaseSecretKey)
    .update(`${userId}:${channel}:${code}`)
    .digest("hex");
}

function isSandboxOtpAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.ALLOW_DEMO_AUTH === "true"
  );
}

function verifyOtpHash(
  userId: string,
  channel: VerificationChannel,
  providedCode: string,
  expectedHash: string
): boolean {
  // TODO(senior-review): Disable sandbox OTP code "000000" once SendGrid/Twilio Verify are live in Prompt B7.3.
  if (isSandboxOtpAllowed() && providedCode === SANDBOX_OTP_CODE) {
    return true;
  }

  const candidate = Buffer.from(hashOtp(userId, channel, providedCode), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (candidate.length === 0 || candidate.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(candidate, expected);
}

function normalizeRegulator(raw?: string, province?: string): RegulatorCode {
  if (raw) {
    const upper = raw.trim().toUpperCase();
    const match = REGULATOR_CODES.find((code) => code === upper);
    if (match) return match;
  }
  // TODO(senior-review): Expand public.regulator_code enum if additional provincial boards (e.g. SK/MB/Atlantic) require distinct codes.
  const prov = province?.trim().toUpperCase();
  if (prov === "AB") return "AMVIC";
  if (prov === "BC") return "VSA";
  if (prov === "QC") return "OPC";
  return "OMVIC";
}

function isChallengeExpired(challenge: ChallengeRow): boolean {
  return new Date(challenge.expires_at).getTime() <= Date.now();
}

async function createOrReuseChallenge(
  admin: AdminClient,
  userId: string,
  forceReset = false
): Promise<ChallengeRow> {
  if (!forceReset) {
    const { data: existing, error: lookupError } = await admin
      .from("auth_challenges")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      throw new ExternalServiceError(
        "Unable to load verification session.",
        "EXTERNAL_SERVICE_ERROR",
        lookupError
      );
    }

    if (existing && !isChallengeExpired(existing)) {
      return existing;
    }
  }

  // TODO(senior-review): Dispatch generated 6-digit OTPs via SendGrid & Twilio Verify in Prompt B7.3.
  const emailOtp = generateOtpCode();
  const phoneOtp = generateOtpCode();
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

  const { data: upserted, error: upsertError } = await admin
    .from("auth_challenges")
    .upsert(
      {
        user_id: userId,
        email_code_hash: hashOtp(userId, "email", emailOtp),
        phone_code_hash: hashOtp(userId, "phone", phoneOtp),
        email_attempts: 0,
        phone_attempts: 0,
        email_last_sent_at: nowIso,
        phone_last_sent_at: nowIso,
        expires_at: expiresAt,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (upsertError || !upserted) {
    throw new ExternalServiceError(
      "Unable to issue contact verification challenge.",
      "EXTERNAL_SERVICE_ERROR",
      upsertError
    );
  }

  logger.info("Issued dual-channel verification challenge", {
    actorId: userId,
    meta: {
      expiresAt,
      forceReset,
      sandboxOtpEnabled: isSandboxOtpAllowed(),
    },
  });

  return upserted;
}

async function issueSessionForVerifiedUser(
  admin: AdminClient,
  profile: ProfileRow
): Promise<AuthSession> {
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    throw new ExternalServiceError(
      "Unable to establish authenticated session.",
      "EXTERNAL_SERVICE_ERROR",
      linkError
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: verifyData, error: verifyError } =
    await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

  if (verifyError || !verifyData.session) {
    throw new ExternalServiceError(
      "Unable to finalize authenticated session.",
      "EXTERNAL_SERVICE_ERROR",
      verifyError
    );
  }

  return {
    accessToken: verifyData.session.access_token,
    user: toSessionUser(profile),
  };
}

async function loadActiveChallengeAndProfile(
  admin: AdminClient,
  registrationId: string
): Promise<{ challenge: ChallengeRow; profile: ProfileRow }> {
  if (!UUID_REGEX.test(registrationId)) {
    throw new NotFoundError(
      "This verification link has expired. Please sign in to get a new code.",
      "REGISTRATION_NOT_FOUND"
    );
  }

  const { data: challenge, error: challengeError } = await admin
    .from("auth_challenges")
    .select("*")
    .eq("id", registrationId)
    .maybeSingle();

  if (challengeError || !challenge || isChallengeExpired(challenge)) {
    throw new NotFoundError(
      "This verification session has expired. Please sign in to get a new code.",
      "REGISTRATION_NOT_FOUND"
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", challenge.user_id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new NotFoundError(
      "This verification session has expired. Please sign in to get a new code.",
      "REGISTRATION_NOT_FOUND"
    );
  }

  return { challenge, profile };
}

function isDuplicateEmailAuthError(error: { message?: string; code?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? "";
  return (
    error.code === "email_exists" ||
    msg.includes("already registered") ||
    msg.includes("already exists")
  );
}

/**
 * Registers a new Seller or pending Dealership Admin in Supabase Auth,
 * hydrates `profiles`, records PIPEDA/Law 25/CASL consents, and issues
 * a dual-channel verification challenge (FR-EU-01, NFR-08, BR-13).
 */
export async function registerAccount(
  payload: RegisterPayload,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
): Promise<PendingVerification> {
  const admin = createAdminSupabaseClient();
  const email = payload.email.toLowerCase();
  const isDealer = payload.role === "DEALER";
  const targetRole: UserRole = isDealer ? "DEALER_ADMIN" : "SELLER";

  const { data: existingProfile, error: existingErr } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingErr) {
    throw new ExternalServiceError(
      "Unable to verify account availability.",
      "EXTERNAL_SERVICE_ERROR",
      existingErr
    );
  }

  if (existingProfile) {
    throw new AppError({
      status: 409,
      code: "EMAIL_TAKEN",
      message: "An account with this email already exists.",
      fields: {
        email: "An account with this email already exists. Sign in instead.",
      },
    });
  }

  const regulator = normalizeRegulator(payload.licensingBody, payload.province);
  const dealershipName = payload.dealershipName?.trim() ?? "";
  const licenseNumber = payload.licenseNumber?.trim() ?? "";

  if (isDealer) {
    const fieldErrors: Record<string, string> = {};
    if (!dealershipName) {
      fieldErrors.dealershipName = "Dealership legal name is required";
    }
    if (!licenseNumber) {
      fieldErrors.licenseNumber = "Dealer license number is required";
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError("Some fields need attention.", fieldErrors);
    }

    const { data: existingDealer, error: dealerLookupErr } = await admin
      .from("dealerships")
      .select("id")
      .eq("regulator", regulator)
      .eq("license_number", licenseNumber)
      .maybeSingle();

    if (dealerLookupErr) {
      throw new ExternalServiceError(
        "Unable to validate dealership license.",
        "EXTERNAL_SERVICE_ERROR",
        dealerLookupErr
      );
    }

    if (existingDealer) {
      throw new AppError({
        status: 409,
        code: "CONFLICT",
        message: "A dealership with this license number is already registered.",
        fields: {
          licenseNumber: "This dealer license number is already registered.",
        },
      });
    }
  }

  const { data: authCreated, error: authCreateErr } =
    await admin.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: false,
      user_metadata: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone_e164: payload.phone,
        postal_code: payload.postalCode,
        province: payload.province,
        marketing_opt_in: payload.marketingOptIn,
      },
      app_metadata: {
        role: targetRole,
        dealership_id: null,
      },
    });

  if (authCreateErr || !authCreated.user) {
    if (authCreateErr && isDuplicateEmailAuthError(authCreateErr)) {
      throw new AppError({
        status: 409,
        code: "EMAIL_TAKEN",
        message: "An account with this email already exists.",
        fields: {
          email: "An account with this email already exists. Sign in instead.",
        },
      });
    }
    throw new ExternalServiceError(
      "Unable to create user account.",
      "EXTERNAL_SERVICE_ERROR",
      authCreateErr
    );
  }

  const userId = authCreated.user.id;
  let createdDealershipId: string | null = null;

  try {
    if (isDealer) {
      // BR-13: Newly registered dealerships stay PENDING until OMVIC/AMVIC/VSA admin verification.
      const { data: dealership, error: dealerInsertErr } = await admin
        .from("dealerships")
        .insert({
          operating_name: dealershipName,
          legal_name: dealershipName,
          regulator,
          license_number: licenseNumber,
          status: "PENDING",
          street_address: "Pending onboarding completion",
          city: "",
          province: payload.province,
          postal_code: payload.postalCode,
          contact_name: `${payload.firstName} ${payload.lastName}`.trim(),
          contact_email: email,
          contact_phone: payload.phone,
        })
        .select("id")
        .single();

      if (dealerInsertErr || !dealership) {
        if (dealerInsertErr?.code === "23505") {
          throw new AppError({
            status: 409,
            code: "CONFLICT",
            message:
              "A dealership with this license number is already registered.",
            fields: {
              licenseNumber: "This dealer license number is already registered.",
            },
          });
        }
        throw new ExternalServiceError(
          "Unable to register dealership record.",
          "EXTERNAL_SERVICE_ERROR",
          dealerInsertErr
        );
      }

      createdDealershipId = dealership.id;
    }

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone_e164: payload.phone,
          postal_code: payload.postalCode,
          province: payload.province,
          role: targetRole,
          dealership_id: createdDealershipId,
          email_verified: false,
          phone_verified: false,
          marketing_opt_in: payload.marketingOptIn,
          account_status: "ACTIVE",
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (profileErr || !profile) {
      throw new ExternalServiceError(
        "Unable to provision user profile.",
        "EXTERNAL_SERVICE_ERROR",
        profileErr
      );
    }

    if (createdDealershipId) {
      const { error: memberErr } = await admin.from("dealership_members").insert({
        dealership_id: createdDealershipId,
        user_id: userId,
        seat_role: "DEALER_ADMIN",
        is_active: true,
      });

      if (memberErr) {
        throw new ExternalServiceError(
          "Unable to create dealership membership.",
          "EXTERNAL_SERVICE_ERROR",
          memberErr
        );
      }
    }

    const consents: Array<{
      user_id: string;
      consent_type: ConsentType;
      granted: boolean;
      policy_version: string;
      ip_address: string | null;
      user_agent: string | null;
    }> = [
      {
        user_id: userId,
        consent_type: "TERMS_OF_SERVICE",
        granted: true,
        policy_version: "1.0",
        ip_address: requestMeta.ipAddress,
        user_agent: requestMeta.userAgent,
      },
      {
        user_id: userId,
        consent_type: "PIPEDA_PRIVACY",
        granted: true,
        policy_version: "1.0",
        ip_address: requestMeta.ipAddress,
        user_agent: requestMeta.userAgent,
      },
      {
        user_id: userId,
        consent_type: "CASL_MARKETING",
        granted: payload.marketingOptIn,
        policy_version: "1.0",
        ip_address: requestMeta.ipAddress,
        user_agent: requestMeta.userAgent,
      },
    ];

    if (payload.province === "QC") {
      consents.push({
        user_id: userId,
        consent_type: "LAW25_PRIVACY",
        granted: true,
        policy_version: "1.0",
        ip_address: requestMeta.ipAddress,
        user_agent: requestMeta.userAgent,
      });
    }

    const { error: consentErr } = await admin
      .from("user_consents")
      .insert(consents);

    if (consentErr) {
      throw new ExternalServiceError(
        "Unable to record regulatory privacy consents.",
        "EXTERNAL_SERVICE_ERROR",
        consentErr
      );
    }

    const challenge = await createOrReuseChallenge(admin, userId, true);
    return toPendingVerification(challenge.id, profile);
  } catch (error: unknown) {
    if (createdDealershipId) {
      await admin.from("dealerships").delete().eq("id", createdDealershipId);
    }
    await admin.auth.admin.deleteUser(userId);
    throw error;
  }
}

/**
 * Restores masked contact verification details for `/verify?rid=...`.
 */
export async function getPendingVerification(
  registrationId: string
): Promise<PendingVerification> {
  const admin = createAdminSupabaseClient();
  const { challenge, profile } = await loadActiveChallengeAndProfile(
    admin,
    registrationId
  );
  return toPendingVerification(challenge.id, profile);
}

/**
 * Verifies either `"email"` or `"phone"` 6-digit OTP; once both channels
 * are verified, cleans up the challenge and issues a real `@supabase/ssr` session.
 */
export async function verifyContactChannel(
  registrationId: string,
  channel: VerificationChannel,
  code: string
): Promise<VerifyContactResponse> {
  const admin = createAdminSupabaseClient();
  const { challenge, profile } = await loadActiveChallengeAndProfile(
    admin,
    registrationId
  );

  const currentAttempts =
    channel === "email" ? challenge.email_attempts : challenge.phone_attempts;
  if (currentAttempts >= OTP_MAX_ATTEMPTS) {
    throw new RateLimitError(
      "Too many incorrect attempts. Request a new code.",
      undefined,
      "OTP_LOCKED"
    );
  }

  const expectedHash =
    channel === "email" ? challenge.email_code_hash : challenge.phone_code_hash;

  if (!verifyOtpHash(profile.id, channel, code, expectedHash)) {
    const nextAttempts = currentAttempts + 1;
    const attemptUpdate =
      channel === "email"
        ? { email_attempts: nextAttempts }
        : { phone_attempts: nextAttempts };

    await admin
      .from("auth_challenges")
      .update(attemptUpdate)
      .eq("id", challenge.id);

    const remaining = Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts);
    throw new AppError({
      status: 422,
      code: "OTP_INVALID",
      message: "That code isn't right",
      fields: {
        code:
          remaining > 0
            ? `That code isn't right. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
            : "Too many incorrect attempts. Request a new code.",
      },
    });
  }

  const profileUpdate =
    channel === "email" ? { email_verified: true } : { phone_verified: true };

  const { data: updatedProfile, error: updateProfileErr } = await admin
    .from("profiles")
    .update(profileUpdate)
    .eq("id", profile.id)
    .select("*")
    .single();

  if (updateProfileErr || !updatedProfile) {
    throw new ExternalServiceError(
      "Unable to update contact verification status.",
      "EXTERNAL_SERVICE_ERROR",
      updateProfileErr
    );
  }

  if (channel === "email") {
    await admin.auth.admin.updateUserById(profile.id, { email_confirm: true });
  }

  const verification = toPendingVerification(challenge.id, updatedProfile);

  if (updatedProfile.email_verified && updatedProfile.phone_verified) {
    await admin.auth.admin.updateUserById(profile.id, { email_confirm: true });
    await admin.from("auth_challenges").delete().eq("id", challenge.id);
    const session = await issueSessionForVerifiedUser(admin, updatedProfile);
    return { verification, session };
  }

  return { verification, session: null };
}

/**
 * Re-issues an OTP on the requested channel while enforcing a 30s cooldown.
 */
export async function resendVerificationCode(
  registrationId: string,
  channel: VerificationChannel
): Promise<ResendCodeResponse> {
  const admin = createAdminSupabaseClient();
  const { challenge, profile } = await loadActiveChallengeAndProfile(
    admin,
    registrationId
  );

  const lastSentRaw =
    channel === "email"
      ? challenge.email_last_sent_at
      : challenge.phone_last_sent_at;
  const elapsedMs = Date.now() - new Date(lastSentRaw).getTime();
  const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;

  if (elapsedMs < cooldownMs) {
    const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
    throw new RateLimitError(
      `Please wait ${retryAfterSeconds}s before requesting another code.`,
      retryAfterSeconds,
      "RESEND_COOLDOWN"
    );
  }

  const newOtp = generateOtpCode();
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

  const updatePayload =
    channel === "email"
      ? {
          email_code_hash: hashOtp(profile.id, "email", newOtp),
          email_attempts: 0,
          email_last_sent_at: nowIso,
          expires_at: expiresAt,
        }
      : {
          phone_code_hash: hashOtp(profile.id, "phone", newOtp),
          phone_attempts: 0,
          phone_last_sent_at: nowIso,
          expires_at: expiresAt,
        };

  const { error: updateErr } = await admin
    .from("auth_challenges")
    .update(updatePayload)
    .eq("id", challenge.id);

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to resend verification code.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  logger.info("Resent contact verification challenge", {
    actorId: profile.id,
    meta: { channel, expiresAt, sandboxOtpEnabled: isSandboxOtpAllowed() },
  });

  return { retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS };
}

/**
 * Authenticates via email/password on the server `@supabase/ssr` client
 * so HttpOnly session cookies are written to the browser response.
 */
export async function loginWithPassword(
  payload: LoginPayload
): Promise<AuthSession> {
  const email = payload.email.toLowerCase();
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      const { data: unconfirmedProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (
        unconfirmedProfile &&
        (!unconfirmedProfile.email_verified ||
          !unconfirmedProfile.phone_verified)
      ) {
        const challenge = await createOrReuseChallenge(
          admin,
          unconfirmedProfile.id,
          false
        );
        throw new ForbiddenError(
          "Verify your email and mobile number to continue",
          "VERIFICATION_REQUIRED",
          toPendingVerification(challenge.id, unconfirmedProfile)
        );
      }
    }

    throw new UnauthorizedError(
      "Email or password is incorrect",
      "INVALID_CREDENTIALS"
    );
  }

  if (!data.user || !data.session) {
    throw new UnauthorizedError(
      "Email or password is incorrect",
      "INVALID_CREDENTIALS"
    );
  }

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    await supabase.auth.signOut();
    throw new UnauthorizedError(
      "Email or password is incorrect",
      "INVALID_CREDENTIALS"
    );
  }

  if (profile.account_status !== "ACTIVE") {
    await supabase.auth.signOut();
    throw new ForbiddenError("Your account is not active.", "ACCOUNT_INACTIVE");
  }

  if (!profile.email_verified || !profile.phone_verified) {
    await supabase.auth.signOut();
    const challenge = await createOrReuseChallenge(admin, profile.id, false);
    throw new ForbiddenError(
      "Verify your email and mobile number to continue",
      "VERIFICATION_REQUIRED",
      toPendingVerification(challenge.id, profile)
    );
  }

  return {
    accessToken: data.session.access_token,
    user: toSessionUser(profile),
  };
}

/**
 * Terminates the Supabase Auth session and clears SSR cookies.
 */
export async function logoutCurrentUser(): Promise<{ loggedOut: true }> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return { loggedOut: true };
}

/**
 * Returns the authenticated caller's canonical `SessionUser` profile.
 */
export async function getCurrentSessionUser(): Promise<SessionUser> {
  const ctx = await requireAuth();
  return toSessionUser(ctx.profile);
}

/**
 * Refreshes the HttpOnly Supabase session and returns updated session metadata.
 */
export async function refreshCurrentSession(): Promise<AuthSession> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session || !data.user) {
    throw new UnauthorizedError(
      "Your session has expired. Please sign in again.",
      "SESSION_EXPIRED"
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileErr || !profile || profile.account_status !== "ACTIVE") {
    await supabase.auth.signOut();
    throw new UnauthorizedError(
      "Your session has expired. Please sign in again.",
      "SESSION_EXPIRED"
    );
  }

  return {
    accessToken: data.session.access_token,
    user: toSessionUser(profile),
  };
}

/**
 * Returns authentication status for session-snapshot callers without throwing on unauthenticated requests.
 */
export async function getSessionSnapshot(): Promise<{
  authenticated: boolean;
  user: SessionUser | null;
}> {
  const ctx = await getSessionContext();
  if (!ctx || ctx.profile.account_status !== "ACTIVE") {
    return { authenticated: false, user: null };
  }
  return { authenticated: true, user: toSessionUser(ctx.profile) };
}

/**
 * Generates a Supabase Auth recovery link for password reset without exposing whether the email exists.
 */
export async function requestPasswordReset(
  email: string
): Promise<ForgotPasswordResponse> {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = email.toLowerCase();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    return {};
  }

  const resetPath = `/reset-password?token=${encodeURIComponent(hashedToken)}`;
  // TODO(senior-review): Dispatch branded bilingual password reset email via SendGrid/Resend in Prompt B7.3.
  logger.info("Generated password recovery link", {
    actorId: data.user?.id,
    meta: { emailMasked: maskEmail(normalizedEmail) },
  });

  if (process.env.NODE_ENV !== "production") {
    return { devResetPath: resetPath };
  }
  return {};
}

/**
 * Verifies a Supabase recovery token hash, updates the user's password, and revokes sessions globally.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ passwordReset: true }> {
  const { url, publishableKey } = getPublicSupabaseEnv();
  const admin = createAdminSupabaseClient();

  const ephemeral = createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await ephemeral.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });

  if (error || !data.user) {
    throw new BadRequestError(
      "This reset link is invalid or has expired. Request a new one.",
      "RESET_TOKEN_INVALID"
    );
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(
    data.user.id,
    { password: newPassword }
  );

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to update password right now.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  if (data.session?.access_token) {
    try {
      await admin.auth.admin.signOut(data.session.access_token, "global");
    } catch {
      // Best-effort global revocation; local cookie signOut runs unconditionally below.
    }
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  return { passwordReset: true };
}

/**
 * Development/demo-only quick role switcher backed by real seeded Supabase demo accounts.
 */
export async function devSwitchDemoRole(
  role?: UserRole | "LOGOUT"
): Promise<{ user: SessionUser | null }> {
  const enabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_SWITCH === "true";

  if (!enabled) {
    throw new NotFoundError("Not found.");
  }

  if (!role || role === "LOGOUT") {
    await logoutCurrentUser();
    return { user: null };
  }

  const demoEmail = DEMO_ACCOUNTS_BY_ROLE[role];
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD ?? "password123";
  const session = await loginWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  return { user: session.user };
}
