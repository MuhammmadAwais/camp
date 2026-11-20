import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  AcceptOfferResponse,
  AppointmentVoucher,
} from "@/lib/types/seller";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_HANDOVER_CHECKLIST: string[] = [
  "Original Vehicle Ownership Permit (Green Slip - Part 1 & 2)",
  "Two original master vehicle smart keys",
  "Government-issued photo identification (Driver's License)",
  "Direct Deposit void cheque or wire payout instructions",
];

export const acceptDealerBidSchema = z.object({
  bidId: z.string().uuid("Invalid dealership bid identifier."),
  selectionReason: z
    .enum(["HIGHEST", "NEAREST", "OTHER"])
    .optional()
    .default("HIGHEST"),
});

export type AcceptDealerBidInput = z.output<typeof acceptDealerBidSchema>;

const rpcAcceptResultSchema = z.object({
  success: z.literal(true),
  match_id: z.string().uuid(),
  voucher_code: z.string().min(4),
  agreed_amount_cents: z.number().int().positive(),
  accept_expires_at: z.string(),
  dealership_id: z.string().uuid(),
});

type RpcErrorLike = {
  code?: string;
  message?: string;
};

/**
 * Translates Postgres `accept_dealer_bid` RPC exceptions into typed HTTP errors
 * without leaking internal SQL details.
 */
function mapAcceptBidRpcError(error: RpcErrorLike): never {
  const raw = (error.message ?? "").trim();

  if (raw.startsWith("UNAUTHORIZED")) {
    throw new UnauthorizedError(
      "Your session has expired. Please sign in again.",
      "UNAUTHENTICATED"
    );
  }
  if (raw.startsWith("LISTING_NOT_FOUND")) {
    throw new NotFoundError("Vehicle listing not found.", "NOT_FOUND");
  }
  if (raw.startsWith("FORBIDDEN")) {
    throw new ForbiddenError(
      "Only the vehicle owner may accept a dealership offer.",
      "FORBIDDEN"
    );
  }
  if (raw.startsWith("AUCTION_NOT_UNSEALED")) {
    throw new ConflictError(
      "This auction must be unsealed before accepting a dealer offer.",
      "AUCTION_NOT_UNSEALED"
    );
  }
  if (raw.startsWith("MATCH_ALREADY_EXISTS") || error.code === "23505") {
    throw new ConflictError(
      "A dealership offer has already been accepted for this vehicle.",
      "MATCH_ALREADY_EXISTS"
    );
  }
  if (raw.startsWith("BID_NOT_FOUND")) {
    throw new NotFoundError(
      "Selected dealer offer is no longer eligible for acceptance.",
      "BID_NOT_FOUND"
    );
  }

  throw new ExternalServiceError(
    "Unable to finalize dealership offer acceptance. Please try again.",
    "EXTERNAL_SERVICE_ERROR",
    error
  );
}

/**
 * Atomically accepts an unsealed dealership offer via Postgres `accept_dealer_bid`
 * RPC (FR-EU-09, FR-EU-10, BR-08), creating the match voucher with a 24h window.
 */
export async function acceptDealerOffer(
  ctx: SessionContext,
  listingId: string,
  input: AcceptDealerBidInput
): Promise<AcceptOfferResponse> {
  if (!UUID_REGEX.test(listingId)) {
    throw new NotFoundError("Vehicle listing not found.");
  }

  if (ctx.role !== "SELLER") {
    throw new ForbiddenError(
      "Only the vehicle owner may accept a dealership offer."
    );
  }

  // Must invoke via authenticated `ctx.supabase` so Postgres `auth.uid()` resolves to seller
  const { data, error } = await ctx.supabase.rpc("accept_dealer_bid", {
    p_listing_id: listingId,
    p_bid_id: input.bidId,
    p_selection_reason: input.selectionReason,
  });

  if (error) {
    mapAcceptBidRpcError(error);
  }

  const parsed = rpcAcceptResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new ExternalServiceError(
      "Unexpected response received while generating handover voucher.",
      "EXTERNAL_SERVICE_ERROR",
      parsed.error
    );
  }

  const result = parsed.data;
  const admin = createAdminSupabaseClient();

  const [dealerRes, listingRes, membersRes] = await Promise.all([
    admin
      .from("dealerships")
      .select(
        "operating_name, street_address, city, province, postal_code, contact_phone, contact_email, operating_hours, license_number, regulator"
      )
      .eq("id", result.dealership_id)
      .maybeSingle(),
    admin
      .from("listings")
      .select("year, make, model, vin, city, province")
      .eq("id", listingId)
      .maybeSingle(),
    admin
      .from("dealership_members")
      .select("user_id")
      .eq("dealership_id", result.dealership_id)
      .eq("is_active", true),
  ]);

  const dealer = dealerRes.data;
  const listing = listingRes.data;

  const voucher: AppointmentVoucher = {
    matchId: result.match_id,
    voucherCode: result.voucher_code,
    dealershipName: dealer?.operating_name ?? "Licensed Dealership",
    licenseNumber: dealer?.license_number ?? undefined,
    regulator: dealer?.regulator ?? undefined,
    address: dealer?.street_address ?? "Confirmed Dealership Location",
    city: dealer?.city ?? listing?.city ?? "Toronto",
    province: dealer?.province ?? listing?.province ?? "ON",
    postalCode: dealer?.postal_code ?? "",
    contactPhone: dealer?.contact_phone ?? "",
    contactEmail: dealer?.contact_email ?? "",
    operatingHours:
      dealer?.operating_hours ?? "Monday - Saturday: 9:00 AM - 6:00 PM",
    acceptedOfferCents: result.agreed_amount_cents,
    expiresAt: result.accept_expires_at,
    checklist: DEFAULT_HANDOVER_CHECKLIST,
  };

  try {
    // TODO(senior-review): Trigger CASL-compliant email/SMS handover voucher & dealer win dispatch in Prompt B7.3.
    const vehicleLabel = listing
      ? `${listing.year} ${listing.make} ${listing.model}`
      : "your vehicle";

    const notifications = [
      {
        user_id: ctx.userId,
        type: "MATCH" as const,
        title: `Offer accepted — Handover pass ${voucher.voucherCode} ready`,
        description: `Your ${vehicleLabel} handover voucher for ${voucher.dealershipName} is active for 24 hours.`,
        listing_id: listingId,
        metadata: {
          matchId: result.match_id,
          voucherCode: voucher.voucherCode,
          dealershipId: result.dealership_id,
          agreedAmountCents: result.agreed_amount_cents,
          expiresAt: voucher.expiresAt,
        },
      },
      ...(membersRes.data ?? []).map((member) => ({
        user_id: member.user_id,
        type: "MATCH" as const,
        title: `Bid won — ${vehicleLabel}`,
        description: `Seller accepted your offer and generated handover pass ${voucher.voucherCode} (valid 24 hours).`,
        listing_id: listingId,
        metadata: {
          matchId: result.match_id,
          voucherCode: voucher.voucherCode,
          dealershipId: result.dealership_id,
          agreedAmountCents: result.agreed_amount_cents,
          expiresAt: voucher.expiresAt,
        },
      })),
    ];

    if (notifications.length > 0) {
      await admin.from("notifications").insert(notifications);
    }
  } catch (notifyErr) {
    logger.warn("Best-effort match notifications failed after bid acceptance", {
      actorId: ctx.userId,
      meta: { listingId, matchId: result.match_id, notifyErr },
    });
  }

  return {
    matchId: result.match_id,
    listingId,
    status: "ACCEPTED",
    voucher,
  };
}
