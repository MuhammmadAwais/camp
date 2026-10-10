import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { createRegistration, db, hashPassword, toPendingVerification, type MockUser } from "@/lib/mock/db";
import { fail, mockApiDisabled, ok, parseJson, simulateLatency } from "@/lib/mock/http";
import { registerPayloadSchema } from "@/lib/schemas/auth-schema";

// FR-EU-01 — create an unverified seller account and send email + SMS codes.
export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;
  await simulateLatency();

  const parsed = await parseJson(request, registerPayloadSchema);
  if ("response" in parsed) return parsed.response;
  const payload = parsed.data;

  if (db.userIdByEmail.has(payload.email)) {
    return fail(409, "EMAIL_TAKEN", "An account with this email already exists", {
      email: "An account with this email already exists. Sign in instead.",
    });
  }

  const user: MockUser = {
    id: randomUUID(),
    email: payload.email,
    passwordHash: hashPassword(payload.password),
    firstName: payload.firstName,
    lastName: payload.lastName,
    phoneE164: payload.phone,
    postalCode: payload.postalCode,
    province: payload.province,
    emailVerified: false,
    phoneVerified: false,
    marketingOptIn: payload.marketingOptIn,
    kyc: { status: "NOT_STARTED", idDocType: null, submittedAt: null, rejectReason: null },
    createdAt: Date.now(),
  };
  db.users.set(user.id, user);
  db.userIdByEmail.set(user.email, user.id);

  const registrationId = createRegistration(user.id);
  return ok(toPendingVerification(registrationId, user), 201);
}
