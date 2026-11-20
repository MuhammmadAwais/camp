import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  decideDealership,
  decideDealershipSchema,
  getAdminDealerApplication,
} from "@/lib/server/services/dealer-verification.service";

export const GET = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (_request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const dealer = await getAdminDealerApplication(ctx, id);
    return ok(dealer);
  }
);

export const PATCH = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const payload = await parseBody(request, decideDealershipSchema);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const result = await decideDealership(ctx, id, payload, { ipAddress });
    return ok(result);
  }
);
