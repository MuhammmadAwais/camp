import type { NextRequest } from "next/server";
import { resolveKyc } from "@/lib/mock/db";
import { mockApiDisabled, ok, requireUser } from "@/lib/mock/http";
import type { KycStatusResponse } from "@/lib/types/auth";

export async function GET(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const user = requireUser(request);
  if (user instanceof Response) return user;

  const kyc = resolveKyc(user);
  const body: KycStatusResponse = {
    status: kyc.status,
    rejectReason: kyc.rejectReason,
    submittedAt: kyc.submittedAt ? new Date(kyc.submittedAt).toISOString() : null,
  };
  return ok(body);
}
