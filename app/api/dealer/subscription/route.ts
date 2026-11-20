import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { getDealerSubscription } from "@/lib/server/services/billing.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireActiveDealership();
  const data = await getDealerSubscription(ctx);
  return ok(data);
});
