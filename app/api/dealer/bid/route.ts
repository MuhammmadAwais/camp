import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import {
  placeSealedBid,
  placeSealedBidSchema,
} from "@/lib/server/services/bidding.service";

export const POST = handleApiRoute(async (request) => {
  const ctx = await requireActiveDealership();
  const rl = await enforceRateLimit(request, "dealer_bid", {
    scopeKey: ctx.dealershipId,
  });
  const body = await parseBody(request, placeSealedBidSchema);
  const headerIdempotencyKey = request.headers.get("idempotency-key");
  const receipt = await placeSealedBid(ctx, body, { headerIdempotencyKey });
  return ok(receipt, 200, rateLimitHeaders(rl));
});
