import { z } from "zod";
import type { DealerSeatRole, SessionContext } from "@/lib/server/auth";
import {
  BadRequestError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  PaymentRequiredError,
  UnauthorizedError,
} from "@/lib/server/errors";
import type { DealerBidReceipt } from "@/lib/types/dealer";

const MIN_BID_CENTS = 100_000; // $1,000 CAD
const MAX_BID_CENTS = 100_000_000; // $1,000,000 CAD sanity cap

const ALLOWED_BIDDING_SEATS: readonly DealerSeatRole[] = [
  "DEALER_ADMIN",
  "DEALER_BUYER",
];

export const placeSealedBidSchema = z.object({
  auctionId: z.string().uuid("Invalid auction identifier."),
  bidAmountCents: z
    .number()
    .int("Bid amount must be whole CAD cents.")
    .min(MIN_BID_CENTS, "Bid must be at least $1,000 CAD.")
    .max(MAX_BID_CENTS, "Bid amount exceeds maximum permitted limit."),
  certifiedDeclaration: z.literal(true, {
    message: "You must attest to the legally binding dealer purchase agreement.",
  }),
  idempotencyKey: z
    .string()
    .trim()
    .min(8, "Idempotency key must be at least 8 characters.")
    .max(128, "Idempotency key is too long.")
    .optional(),
  conditions: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type PlaceSealedBidInput = z.output<typeof placeSealedBidSchema>;

const rpcBidResultSchema = z.object({
  success: z.literal(true),
  idempotent: z.boolean(),
  bid_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  version: z.number().int().min(1),
  revision_count: z.number().int().min(0),
  placed_at: z.string(),
});

type RpcErrorLike = {
  code?: string;
  message?: string;
};

function formatCadWhole(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Translates Postgres `submit_dealer_bid` RPC exceptions into clean typed HTTP errors
 * without leaking internal SQL details.
 */
function mapBidRpcError(error: RpcErrorLike): never {
  const raw = (error.message ?? "").trim();

  if (raw.startsWith("UNAUTHORIZED")) {
    throw new UnauthorizedError(
      "Your session has expired. Please sign in again.",
      "UNAUTHENTICATED"
    );
  }
  if (raw.startsWith("INVALID_BID_AMOUNT")) {
    throw new BadRequestError(
      "Bid amount must be a valid positive integer in CAD cents.",
      "INVALID_BID_AMOUNT"
    );
  }
  if (raw.startsWith("INVALID_IDEMPOTENCY_KEY")) {
    throw new BadRequestError(
      "A valid idempotency key is required.",
      "INVALID_IDEMPOTENCY_KEY"
    );
  }
  if (raw.startsWith("FORBIDDEN_INSPECTOR_BID")) {
    throw new ForbiddenError(
      "Only dealership admins and wholesale buyers can place sealed bids.",
      "FORBIDDEN_INSPECTOR_BID"
    );
  }
  if (raw.startsWith("DEALERSHIP_NOT_VERIFIED")) {
    throw new ForbiddenError(
      "Your dealership licence verification is pending or suspended.",
      "DEALERSHIP_NOT_VERIFIED"
    );
  }
  if (raw.startsWith("FORBIDDEN")) {
    throw new ForbiddenError(
      "You do not have permission to place bids on behalf of a dealership.",
      "FORBIDDEN"
    );
  }
  if (raw.startsWith("LISTING_NOT_FOUND")) {
    throw new NotFoundError("Vehicle auction not found.", "NOT_FOUND");
  }
  if (raw.startsWith("AUCTION_NOT_ACTIVE")) {
    throw new ConflictError(
      "This auction is no longer open for bidding.",
      "AUCTION_NOT_ACTIVE"
    );
  }
  if (raw.startsWith("BID_MUST_INCREASE")) {
    const match = raw.match(/must exceed current bid \((\d+)\)/i);
    const currentBidCents = match ? Number.parseInt(match[1], 10) : undefined;
    const message =
      currentBidCents !== undefined && Number.isFinite(currentBidCents)
        ? `Revised bid must exceed your current sealed bid of ${formatCadWhole(currentBidCents)} CAD.`
        : "Revised bid must exceed your current sealed bid.";
    throw new ConflictError(
      message,
      "BID_MUST_INCREASE",
      currentBidCents !== undefined && Number.isFinite(currentBidCents)
        ? { currentBidCents }
        : undefined
    );
  }
  if (raw.startsWith("SUBSCRIPTION_PAST_DUE")) {
    throw new PaymentRequiredError(
      "Your dealership subscription is inactive or past due. Please update billing to continue bidding.",
      "SUBSCRIPTION_PAST_DUE"
    );
  }
  if (raw.startsWith("QUOTA_EXCEEDED")) {
    throw new PaymentRequiredError(
      "Your monthly dealership bid quota has been exhausted. Upgrade your plan to place more bids.",
      "QUOTA_EXCEEDED"
    );
  }
  if (error.code === "23505") {
    throw new ConflictError(
      "Concurrent bid conflict detected. Please retry your submission.",
      "CONFLICT"
    );
  }

  throw new ExternalServiceError(
    "Unable to submit sealed bid right now. Please try again.",
    "EXTERNAL_SERVICE_ERROR",
    error
  );
}

/**
 * Submits an atomic, upward-only sealed dealer bid via Postgres `submit_dealer_bid` RPC
 * (FR-DL-07, FR-DL-08, BR-05, BR-06, H2, NFR-14, NFR-15).
 */
export async function placeSealedBid(
  ctx: SessionContext & { dealershipId: string },
  input: PlaceSealedBidInput,
  options?: { headerIdempotencyKey?: string | null }
): Promise<DealerBidReceipt> {
  if (ctx.role !== "DEALER_ADMIN" && ctx.role !== "DEALER_AGENT") {
    throw new ForbiddenError(
      "Only verified dealership buyers or administrators can place wholesale bids.",
      "FORBIDDEN"
    );
  }

  if (!ctx.seatRole || !ALLOWED_BIDDING_SEATS.includes(ctx.seatRole)) {
    throw new ForbiddenError(
      "Only dealership admins and wholesale buyers can place sealed bids.",
      "FORBIDDEN_INSPECTOR_BID"
    );
  }

  const rawKey =
    input.idempotencyKey?.trim() ||
    options?.headerIdempotencyKey?.trim() ||
    crypto.randomUUID();
  // Scope key by dealership so two dealerships cannot collide on bids.idempotency_key UNIQUE
  const scopedKey = `${ctx.dealershipId}:${rawKey}`;

  // Execute via authenticated user session client (`auth.uid()` resolved inside RPC)
  const { data, error } = await ctx.supabase.rpc("submit_dealer_bid", {
    p_listing_id: input.auctionId,
    p_amount_cents: input.bidAmountCents,
    p_idempotency_key: scopedKey,
    ...(input.conditions ? { p_conditions: input.conditions } : {}),
    ...(input.notes ? { p_notes: input.notes } : {}),
  });

  if (error) {
    mapBidRpcError(error);
  }

  const parsed = rpcBidResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new ExternalServiceError(
      "Unexpected response received from sealed bid processor.",
      "EXTERNAL_SERVICE_ERROR",
      parsed.error
    );
  }

  const receipt = parsed.data;
  const message = receipt.idempotent
    ? "Sealed bid already recorded for this submission key."
    : receipt.revision_count > 0
      ? "Sealed bid successfully revised upward."
      : "Sealed bid securely submitted to AutoNexa dealer exchange.";

  return {
    success: true,
    idempotent: receipt.idempotent,
    bidId: receipt.bid_id,
    auctionId: receipt.listing_id,
    bidAmountCents: receipt.amount_cents,
    version: receipt.version,
    revisionCount: receipt.revision_count,
    placedAt: receipt.placed_at,
    message,
  };
}
