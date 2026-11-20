import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  acceptDealerBidSchema,
  acceptDealerOffer,
} from "@/lib/server/services/fulfillment.service";
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
  async (request: NextRequest, context) => {
    const ctx = await requireRole(["SELLER"]);
    const { id } = await context.params;
    const payload = await parseBody(request, acceptDealerBidSchema);
    const accepted = await acceptDealerOffer(ctx, id, payload);
    return ok(accepted);
  }
);
