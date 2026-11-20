import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { getSellerDashboard } from "@/lib/server/services/listing.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireRole(["SELLER", "ADMIN"]);
  const data = await getSellerDashboard(ctx);
  return ok(data);
});
