import type { NextRequest } from "next/server";
import { createRegistration, db, findRegistrationByUser, toPendingVerification, verifyPassword } from "@/lib/mock/db";
import { fail, failWithDetails, mockApiDisabled, parseJson, sessionResponse, simulateLatency } from "@/lib/mock/http";
import { loginSchema } from "@/lib/schemas/auth-schema";

export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;
  await simulateLatency();

  const parsed = await parseJson(request, loginSchema);
  if ("response" in parsed) return parsed.response;
  const { email, password } = parsed.data;

  const userId = db.userIdByEmail.get(email);
  const user = userId ? db.users.get(userId) : undefined;

  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  // FR-EU-01: login stays disabled until both email and phone are verified.
  if (!user.emailVerified || !user.phoneVerified) {
    const registrationId = findRegistrationByUser(user.id) ?? createRegistration(user.id);
    return failWithDetails(
      403,
      "VERIFICATION_REQUIRED",
      "Verify your email and mobile number to continue",
      toPendingVerification(registrationId, user)
    );
  }

  return sessionResponse(user);
}
