import type { NextRequest } from "next/server";
import { db, issueResetToken } from "@/lib/mock/db";
import { mockApiDisabled, ok, parseJson, simulateLatency } from "@/lib/mock/http";
import { forgotPasswordSchema } from "@/lib/schemas/auth-schema";
import type { ForgotPasswordResponse } from "@/lib/types/auth";

// Always responds 200 so the endpoint can't be used to discover which emails have accounts.
export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;
  await simulateLatency();

  const parsed = await parseJson(request, forgotPasswordSchema);
  if ("response" in parsed) return parsed.response;

  const userId = db.userIdByEmail.get(parsed.data.email);
  const body: ForgotPasswordResponse = {};
  if (userId) {
    const token = issueResetToken(userId);
    body.devResetPath = `/reset-password?token=${token}`;
    console.info(`[mock-api] Password reset link for ${parsed.data.email}: ${body.devResetPath}`);
  }
  return ok(body);
}
