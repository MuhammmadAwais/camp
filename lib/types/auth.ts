import type { ProvinceCode } from "@/lib/canada";

// SRS FR-EU-02 states plus NOT_STARTED for users with no KYC record yet (USER 1 — 0..1 KYC_VERIFICATION).
export type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";

export type UserRole = "SELLER" | "DEALER_ADMIN" | "DEALER_AGENT" | "ADMIN";

export type IdDocumentType = "DRIVERS_LICENCE" | "PASSPORT";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneMasked: string;
  postalCode: string;
  province: ProvinceCode;
  role: UserRole;
  kycStatus: KycStatus;
  mfaEnabled?: boolean;
  languagePref?: "en" | "fr";
};

export type MfaFactorSummary = {
  id: string;
  friendlyName: string;
  factorType: "totp" | "phone" | "webauthn";
  status: "verified" | "unverified";
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  user: SessionUser;
  mfaRequired?: boolean;
  mfaEnrollmentRequired?: boolean;
  aal?: "aal1" | "aal2" | null;
  nextAal?: "aal1" | "aal2" | null;
  mfaFactors?: MfaFactorSummary[];
};

export type MfaFactorsResponse = {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  mfaRequiredForRole: boolean;
  mfaEnabled: boolean;
  factors: MfaFactorSummary[];
  serverTime: string;
};

export type MfaEnrollPayload = {
  friendlyName?: string;
};

export type MfaEnrollResponse = {
  factorId: string;
  friendlyName: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export type MfaVerifyPayload = {
  factorId: string;
  code: string;
};

export type MfaVerifyResponse = {
  verified: true;
  factorId: string;
  currentLevel: "aal2";
  session: AuthSession;
};

export type MfaUnenrollPayload = {
  factorId: string;
};

export type MfaUnenrollResponse = {
  unenrolled: true;
  factorId: string;
  mfaEnabled: boolean;
};

// Returned by registration and by login attempts on an unverified account (FR-EU-01).
export type PendingVerification = {
  registrationId: string;
  emailMasked: string;
  phoneMasked: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export type VerificationChannel = "email" | "phone";

export type KycStatusResponse = {
  status: KycStatus;
  rejectReason: string | null;
  submittedAt: string | null; // ISO 8601 UTC
};

export type VerifyContactResponse = {
  verification: PendingVerification;
  // Issued once both email and phone are verified — login is enabled from that point (FR-EU-01).
  session: AuthSession | null;
};

export type ResendCodeResponse = { retryAfterSeconds: number };

export type ForgotPasswordResponse = {
  // Mock-only convenience so the reset flow can be tested without an inbox. The real API never returns this.
  devResetPath?: string;
};
