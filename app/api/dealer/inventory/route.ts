import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  dealerInventoryQuerySchema,
  listActiveInventory,
} from "@/lib/server/services/dealer-feed.service";

export const GET = handleApiRoute(async (request) => {
  const ctx = await requireActiveDealership();
  const filters = parseQuery(request, dealerInventoryQuerySchema);
  const inventory = await listActiveInventory(ctx, filters);
  return ok(inventory);
});
