import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { ValidationError } from "@/lib/server/errors";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  adminAuctionOverrideSchema,
  extendAuction,
  forceCloseAuction,
  haltAuction,
} from "@/lib/server/services/admin-auctions.service";

export const POST = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const payload = await parseBody(request, adminAuctionOverrideSchema);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const requestMeta = { ipAddress };

    if (payload.action === "EXTEND") {
      if (payload.extensionHours === undefined) {
        throw new ValidationError("Extension duration (hours) is required.", {
          extensionHours: "Select an extension duration.",
        });
      }
      const result = await extendAuction(
        ctx,
        id,
        payload.extensionHours,
        payload.reason,
        requestMeta
      );
      return ok(result);
    }

    if (payload.action === "FORCE_CLOSE") {
      const result = await forceCloseAuction(
        ctx,
        id,
        payload.reason,
        requestMeta
      );
      return ok(result);
    }

    const result = await haltAuction(ctx, id, payload.reason, requestMeta);
    return ok(result);
  }
);
