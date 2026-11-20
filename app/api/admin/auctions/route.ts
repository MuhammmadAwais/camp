import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { listAllAuctions } from "@/lib/server/services/admin-auctions.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireRole(["ADMIN"]);
  const auctions = await listAllAuctions(ctx);
  return ok(auctions);
});
