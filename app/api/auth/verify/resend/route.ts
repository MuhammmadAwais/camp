import type { NextRequest } from "next/server";
import { OTP_RESEND_COOLDOWN_MS, getRegistration, logOtp } from "@/lib/mock/db";
import { fail, mockApiDisabled, ok, parseJson, simulateLatency } from "@/lib/mock/http";
import { resendPayloadSchema } from "@/lib/schemas/auth-schema";
import type { ResendCodeResponse } from "@/lib/types/auth";

export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;
  await simulateLatency(300);

  const parsed = await parseJson(request, resendPayloadSchema);
  if ("response" in parsed) return parsed.response;
  const { registrationId, channel } = parsed.data;

  const found = getRegistration(registrationId);
  if (!found) return fail(404, "REGISTRATION_NOT_FOUND", "This verification session has expired. Please sign in again.");

  const { registration, user } = found;
  const elapsed = Date.now() - registration.lastSentAt[channel];
  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
    return fail(429, "RESEND_COOLDOWN", `Please wait ${retryAfterSeconds}s before requesting another code.`);
  }

  registration.lastSentAt[channel] = Date.now();
  registration.attempts[channel] = 0;
  logOtp(user.id, channel);

  const body: ResendCodeResponse = { retryAfterSeconds: OTP_RESEND_COOLDOWN_MS / 1000 };
  return ok(body);
}
