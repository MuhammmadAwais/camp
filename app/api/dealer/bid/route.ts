import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  placeSealedBid,
  placeSealedBidSchema,
} from "@/lib/server/services/bidding.service";

export const POST = handleApiRoute(async (request) => {
  const ctx = await requireActiveDealership();
  const body = await parseBody(request, placeSealedBidSchema);
  const headerIdempotencyKey = request.headers.get("idempotency-key");
  const receipt = await placeSealedBid(ctx, body, { headerIdempotencyKey });
  return ok(receipt);
});
