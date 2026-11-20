import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  updateUserAccountStatus,
  updateUserStatusSchema,
} from "@/lib/server/services/settings.service";

export const PATCH = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const payload = await parseBody(request, updateUserStatusSchema);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const result = await updateUserAccountStatus(ctx, id, payload, {
      ipAddress,
    });
    return ok(result);
  }
);
