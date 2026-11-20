import type { NextRequest } from "next/server";
import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { launchDealerBillingPortal } from "@/lib/server/services/billing.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireActiveDealership(["DEALER_ADMIN"]);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await launchDealerBillingPortal(ctx, {
    ipAddress,
    origin: request.nextUrl.origin,
  });
  return ok(result);
});
