import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { created, handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  listMyDisputes,
  openDispute,
  openDisputeSchema,
} from "@/lib/server/services/dispute.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireAuth();
  const disputes = await listMyDisputes(ctx);
  return ok(disputes);
});

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const payload = await parseBody(request, openDisputeSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const dispute = await openDispute(ctx, payload, { ipAddress });
  return created(dispute);
});
