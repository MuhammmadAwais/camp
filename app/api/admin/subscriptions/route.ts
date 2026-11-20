import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  adminSubscriptionsQuerySchema,
  listAdminSubscriptions,
} from "@/lib/server/services/billing.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["ADMIN"]);
  const query = parseQuery(request, adminSubscriptionsQuerySchema);
  const result = await listAdminSubscriptions(ctx, query);
  return ok(result);
});
