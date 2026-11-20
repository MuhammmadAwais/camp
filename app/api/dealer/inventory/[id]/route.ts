import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { getDealerAuctionDetail } from "@/lib/server/services/dealer-feed.service";

export const GET = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (_request, { params }) => {
    const ctx = await requireActiveDealership();
    const { id } = await params;
    const detail = await getDealerAuctionDetail(ctx, id);
    return ok(detail);
  }
);
