import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  adminDealersQuerySchema,
  listDealerApplications,
} from "@/lib/server/services/dealer-verification.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["ADMIN"]);
  const filters = parseQuery(request, adminDealersQuerySchema);
  const roster = await listDealerApplications(ctx, filters);
  return ok(roster);
});
