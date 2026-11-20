import type { NextRequest } from "next/server";
import {
  requireAal2ForPrivilegedRoles,
  requireActiveDealership,
} from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  checkoutPayloadSchema,
  launchDealerCheckout,
} from "@/lib/server/services/billing.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAal2ForPrivilegedRoles(
    await requireActiveDealership(["DEALER_ADMIN"])
  );
  const payload = await parseBody(request, checkoutPayloadSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await launchDealerCheckout(ctx, payload, {
    ipAddress,
    origin: request.nextUrl.origin,
  });
  return ok(result);
});
