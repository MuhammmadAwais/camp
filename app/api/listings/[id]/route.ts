import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { AppError } from "@/lib/server/errors";
import { handleApiRoute, ok } from "@/lib/server/http";
import { getSellerListingDetail } from "@/lib/server/services/listing.service";

export const GET = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (_request: NextRequest, context) => {
    const ctx = await requireRole(["SELLER", "ADMIN"]);
    const { id } = await context.params;
    const detail = await getSellerListingDetail(ctx, id);
    return ok(detail);
  }
);

export const POST = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async () => {
    await requireRole(["SELLER", "ADMIN"]);
    throw new AppError({
      status: 501,
      code: "NOT_IMPLEMENTED",
      message: "Dealership bid acceptance will be activated in Prompt B4.4.",
    });
  }
);
