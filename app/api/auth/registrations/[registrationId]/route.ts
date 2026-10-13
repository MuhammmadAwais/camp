import type { NextRequest } from "next/server";
import { getRegistration, toPendingVerification } from "@/lib/mock/db";
import { fail, mockApiDisabled, ok } from "@/lib/mock/http";

// Lets the verify page restore masked contact details after a reload.
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/auth/registrations/[registrationId]">) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const { registrationId } = await ctx.params;
  const found = getRegistration(registrationId);
  if (!found) {
    return fail(404, "REGISTRATION_NOT_FOUND", "This verification link has expired. Please sign in to get a new code.");
  }
  return ok(toPendingVerification(registrationId, found.user));
}
