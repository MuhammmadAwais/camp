import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { created, handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  getMyDealershipOnboarding,
  submitDealershipApplication,
  submitDealershipApplicationSchema,
} from "@/lib/server/services/dealer-verification.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireAuth();
  const status = await getMyDealershipOnboarding(ctx);
  return ok(status);
});

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const payload = await parseBody(request, submitDealershipApplicationSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await submitDealershipApplication(ctx, payload, { ipAddress });
  if (result.created) {
    return created(result);
  }
  return ok(result);
});
