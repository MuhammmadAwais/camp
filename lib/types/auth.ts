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
};

export type AuthSession = {
  accessToken: string;
  user: SessionUser;
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
