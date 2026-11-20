import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { listDealerWonMatches } from "@/lib/server/services/dealer-matches.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireActiveDealership();
  const data = await listDealerWonMatches(ctx);
  return ok(data);
});
