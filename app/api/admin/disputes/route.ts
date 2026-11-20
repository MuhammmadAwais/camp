import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  adminDisputesQuerySchema,
  listDisputes,
} from "@/lib/server/services/dispute.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["ADMIN"]);
  const filters = parseQuery(request, adminDisputesQuerySchema);
  const queue = await listDisputes(ctx, filters);
  return ok(queue);
});
