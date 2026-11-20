import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  getDisputeDetail,
  resolveDispute,
  resolveDisputeSchema,
} from "@/lib/server/services/dispute.service";

export const GET = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (_request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const dispute = await getDisputeDetail(ctx, id);
    return ok(dispute);
  }
);

export const PATCH = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const payload = await parseBody(request, resolveDisputeSchema);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const result = await resolveDispute(ctx, id, payload, { ipAddress });
    return ok(result);
  }
);
