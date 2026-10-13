import type { NextRequest } from "next/server";
import { OTP_MAX_ATTEMPTS, db, getRegistration, isValidOtp, toPendingVerification } from "@/lib/mock/db";
import { createSession, fail, mockApiDisabled, ok, parseJson, simulateLatency, withRefreshCookie } from "@/lib/mock/http";
import { verifyPayloadSchema } from "@/lib/schemas/auth-schema";
import type { VerifyContactResponse } from "@/lib/types/auth";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/auth/verify/[channel]">) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;
  await simulateLatency();

  const { channel } = await ctx.params;
  if (channel !== "email" && channel !== "phone") return fail(404, "NOT_FOUND", "Unknown verification channel");

  const parsed = await parseJson(request, verifyPayloadSchema);
  if ("response" in parsed) return parsed.response;
  const { registrationId, code } = parsed.data;

  const found = getRegistration(registrationId);
  if (!found) {
    return fail(404, "REGISTRATION_NOT_FOUND", "This verification session has expired. Please sign in to get a new code.");
  }
  const { registration, user } = found;

  if (registration.attempts[channel] >= OTP_MAX_ATTEMPTS) {
    return fail(429, "OTP_LOCKED", "Too many incorrect attempts. Request a new code.");
  }

  if (!isValidOtp(code)) {
    registration.attempts[channel] += 1;
    const remaining = OTP_MAX_ATTEMPTS - registration.attempts[channel];
    return fail(422, "OTP_INVALID", "That code isn't right", {
      code: remaining > 0 ? `That code isn't right. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Request a new code.",
    });
  }

  if (channel === "email") user.emailVerified = true;
  else user.phoneVerified = true;

  const verification = toPendingVerification(registrationId, user);

  if (user.emailVerified && user.phoneVerified) {
    db.registrations.delete(registrationId);
    const { session, refreshToken } = createSession(user);
    const body: VerifyContactResponse = { verification, session };
    return withRefreshCookie(ok(body), refreshToken);
  }

  const body: VerifyContactResponse = { verification, session: null };
  return ok(body);
}
