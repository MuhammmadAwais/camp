import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { ProvinceCode } from "@/lib/canada";
import type { IdDocumentType, KycStatus, PendingVerification, SessionUser, UserRole } from "@/lib/types/auth";
import { MOCK_DEMO_SELLER, MOCK_DEMO_DEALER, MOCK_DEMO_ADMIN, MOCK_KYC_REVIEW_MS, MOCK_OTP_CODE } from "@/lib/mock/seed";

// In-memory stand-in for the Express + MySQL backend. Resets when the dev server restarts.

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export type MockUser = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  postalCode: string;
  province: ProvinceCode;
  emailVerified: boolean;
  phoneVerified: boolean;
  marketingOptIn: boolean;
  kyc: {
    status: KycStatus;
    idDocType: IdDocumentType | null;
    submittedAt: number | null;
    rejectReason: string | null;
  };
  role?: UserRole;
  dealershipName?: string;
  licenseNumber?: string;
  createdAt: number;
};

type Registration = {
  userId: string;
  attempts: Record<"email" | "phone", number>;
  lastSentAt: Record<"email" | "phone", number>;
};

type Token = { userId: string; expiresAt: number };

type MockDb = {
  users: Map<string, MockUser>;
  userIdByEmail: Map<string, string>;
  registrations: Map<string, Registration>;
  accessTokens: Map<string, Token>;
  refreshTokens: Map<string, Token>;
  resetTokens: Map<string, Token>;
};

// ---------- Passwords (scrypt, as a stand-in for the backend's argon2/bcrypt) ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ---------- Store (kept on globalThis so it survives dev hot reloads) ----------

function syncDemoUser(
  database: MockDb,
  id: string,
  seed: { email: string; password: string; firstName: string; lastName: string; phone: string; postalCode: string; province: string; dealershipName?: string; licenseNumber?: string },
  role: UserRole
) {
  const emailKey = seed.email.toLowerCase();
  const existingId = database.userIdByEmail.get(emailKey) ?? id;
  const user: MockUser = {
    id: existingId,
    email: seed.email,
    passwordHash: hashPassword(seed.password),
    firstName: seed.firstName,
    lastName: seed.lastName,
    phoneE164: seed.phone,
    postalCode: seed.postalCode,
    province: seed.province as any,
    emailVerified: true,
    phoneVerified: true,
    marketingOptIn: false,
    role,
    dealershipName: seed.dealershipName,
    licenseNumber: seed.licenseNumber,
    kyc: { status: "VERIFIED", idDocType: role === "SELLER" ? "DRIVERS_LICENCE" : null, submittedAt: Date.now() - 86400000, rejectReason: null },
    createdAt: Date.now() - 86400000,
  };
  database.users.set(user.id, user);
  database.userIdByEmail.set(emailKey, user.id);
}

function createDb(): MockDb {
  const database: MockDb = {
    users: new Map(),
    userIdByEmail: new Map(),
    registrations: new Map(),
    accessTokens: new Map(),
    refreshTokens: new Map(),
    resetTokens: new Map(),
  };

  syncDemoUser(database, "usr_mock_seller_001", MOCK_DEMO_SELLER, "SELLER");
  syncDemoUser(database, "usr_mock_dealer_001", MOCK_DEMO_DEALER, "DEALER_ADMIN");
  syncDemoUser(database, "usr_mock_admin_001", MOCK_DEMO_ADMIN, "ADMIN");

  return database;
}

function getOrCreateDb(): MockDb {
  const globalRef = globalThis as typeof globalThis & { __autonexaMockDb?: MockDb };
  if (!globalRef.__autonexaMockDb) {
    globalRef.__autonexaMockDb = createDb();
  }
  const database = globalRef.__autonexaMockDb;
  // Always update credentials and kyc to match current seed on any module evaluation
  syncDemoUser(database, "usr_mock_seller_001", MOCK_DEMO_SELLER, "SELLER");
  syncDemoUser(database, "usr_mock_dealer_001", MOCK_DEMO_DEALER, "DEALER_ADMIN");
  syncDemoUser(database, "usr_mock_admin_001", MOCK_DEMO_ADMIN, "ADMIN");
  return database;
}

export const db: MockDb = getOrCreateDb();

// ---------- Helpers ----------

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

function issue(map: Map<string, Token>, userId: string, ttlMs: number): string {
  const token = newToken();
  map.set(token, { userId, expiresAt: Date.now() + ttlMs });
  return token;
}

export function issueSessionTokens(userId: string): { accessToken: string; refreshToken: string } {
  return {
    accessToken: issue(db.accessTokens, userId, ACCESS_TOKEN_TTL_MS),
    refreshToken: issue(db.refreshTokens, userId, REFRESH_TOKEN_TTL_MS),
  };
}

export function issueResetToken(userId: string): string {
  return issue(db.resetTokens, userId, RESET_TOKEN_TTL_MS);
}

export function consumeToken(map: Map<string, Token>, token: string | undefined | null): MockUser | null {
  if (!token) return null;
  const entry = map.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    map.delete(token);
    return null;
  }
  return db.users.get(entry.userId) ?? null;
}

export function createRegistration(userId: string): string {
  const registrationId = randomUUID();
  const now = Date.now();
  db.registrations.set(registrationId, {
    userId,
    attempts: { email: 0, phone: 0 },
    lastSentAt: { email: now, phone: now },
  });
  logOtp(userId, "email");
  logOtp(userId, "phone");
  return registrationId;
}

export function findRegistrationByUser(userId: string): string | null {
  for (const [id, reg] of db.registrations) if (reg.userId === userId) return id;
  return null;
}

export function getRegistration(registrationId: string): { registration: Registration; user: MockUser } | null {
  const registration = db.registrations.get(registrationId);
  if (!registration) return null;
  const user = db.users.get(registration.userId);
  return user ? { registration, user } : null;
}

export function isValidOtp(code: string): boolean {
  return code === MOCK_OTP_CODE;
}

export function logOtp(userId: string, channel: "email" | "phone"): void {
  const user = db.users.get(userId);
  const target = channel === "email" ? user?.email : user?.phoneE164;
  console.info(`[mock-api] ${channel.toUpperCase()} OTP for ${target}: ${MOCK_OTP_CODE}`);
}

// The mock KYC provider approves a submission once the review delay has passed.
export function resolveKyc(user: MockUser): MockUser["kyc"] {
  const { kyc } = user;
  if (kyc.status === "PENDING" && kyc.submittedAt && Date.now() - kyc.submittedAt >= MOCK_KYC_REVIEW_MS) {
    kyc.status = "VERIFIED";
  }
  return kyc;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

export function maskPhone(e164: string): string {
  return `(•••) •••-${e164.slice(-4)}`;
}

export function toSessionUser(user: MockUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneMasked: maskPhone(user.phoneE164),
    postalCode: user.postalCode,
    province: user.province,
    role: user.role ?? "SELLER",
    kycStatus: resolveKyc(user).status,
  };
}

export function toPendingVerification(registrationId: string, user: MockUser): PendingVerification {
  return {
    registrationId,
    emailMasked: maskEmail(user.email),
    phoneMasked: maskPhone(user.phoneE164),
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}
