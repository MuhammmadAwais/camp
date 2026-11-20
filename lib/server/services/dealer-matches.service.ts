import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import {
  DEFAULT_THUMBNAIL,
  normalizeDamageGrade,
  sortPhotos,
  toReserveStatus,
} from "@/lib/server/services/dealer-feed.service";
import {
  disputeEvidencePhotoInputSchema,
  openDispute,
} from "@/lib/server/services/dispute.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  DealerActiveBidItem,
  DealerActiveBidsResponse,
  DealerActiveBidStanding,
  DealerWonMatchesResponse,
  DealerWonMatchesSummary,
  LogMatchOutcomeResponse,
  WonMatchItem,
} from "@/lib/types/dealer";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DealerContext = SessionContext & { dealershipId: string };
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type SellerProfilePick = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "first_name"
  | "last_name"
  | "email"
  | "phone_e164"
  | "city"
  | "province"
  | "postal_code"
  | "kyc_status"
>;

export const logMatchOutcomeSchema = z.object({
  outcome: z.enum([
    "APPOINTMENT_CONFIRMED",
    "COMPLETED",
    "RENEGOTIATED_LOWER",
    "NO_SHOW",
    "DECLINED_AFTER_INSPECTION",
  ]),
  finalPriceCents: z
    .number()
    .int("Final settlement payout must be whole CAD cents.")
    .min(0, "Final settlement payout cannot be negative.")
    .max(100_000_000, "Final settlement payout exceeds permitted limit.")
    .nullable()
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  openDispute: z.boolean().optional(),
  disputeCategory: z
    .enum([
      "UNDERBODY_DAMAGE",
      "MISSING_KEYS",
      "MECHANICAL_POWERTRAIN",
      "ODOMETER_DISCREPANCY",
      "UNRESOLVED_LIEN",
    ])
    .optional(),
  technicianName: z.string().trim().max(120).nullable().optional(),
  evidencePhotos: z.array(disputeEvidencePhotoInputSchema).max(12).optional(),
});

export type LogMatchOutcomeInput = z.output<typeof logMatchOutcomeSchema>;

function formatPhoneDisplay(raw: string | null): string {
  if (!raw) return "Not provided";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function buildAppointmentLocation(
  dealership:
    | {
        operating_name: string;
        street_address: string;
        city: string;
      }
    | null
    | undefined
): string {
  if (!dealership) return "Verified Dealership Intake Bay";
  return `${dealership.operating_name} (${dealership.street_address}, ${dealership.city})`;
}

/**
 * Lists open/awaiting-selection sealed bids belonging strictly to the caller's dealership
 * via Postgres RLS (`H1 / BR-04` sealed-bid invariant: zero competitor amounts or reserve values).
 */
export async function listDealerActiveBids(
  ctx: DealerContext
): Promise<DealerActiveBidsResponse> {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const [dealershipRes, bidsRes] = await Promise.all([
    ctx.supabase
      .from("dealerships")
      .select("id, operating_name, postal_code, city, province")
      .eq("id", ctx.dealershipId)
      .maybeSingle(),
    ctx.supabase
      .from("bids")
      .select(
        "id, listing_id, amount_cents, status, revision_count, created_at, revised_at, updated_at"
      )
      .eq("dealership_id", ctx.dealershipId)
      .in("status", ["ACTIVE", "EXPIRED"])
      .order("updated_at", { ascending: false }),
  ]);

  if (bidsRes.error) {
    throw new ExternalServiceError(
      "Unable to load dealership active bids.",
      "EXTERNAL_SERVICE_ERROR",
      bidsRes.error
    );
  }

  const dealership = dealershipRes.data;
  const dealershipName = dealership?.operating_name ?? "Verified Dealership";
  const bids = bidsRes.data ?? [];

  if (bids.length === 0) {
    return {
      items: [],
      summary: {
        totalCommittedCents: 0,
        activeBidsCount: 0,
        closingSoonCount: 0,
        awaitingSellerCount: 0,
      },
      dealershipName,
      serverTime: nowIso,
    };
  }

  const listingIds = Array.from(new Set(bids.map((b) => b.listing_id)));
  const [listingsRes, distancesRes] = await Promise.all([
    ctx.supabase
      .from("listings")
      .select(
        `
      id,
      vin,
      year,
      make,
      model,
      trim,
      mileage_km,
      body_type,
      transmission,
      drivetrain,
      exterior_color,
      interior_color,
      province,
      city,
      postal_code,
      damage_grade,
      damage_hotspot_count,
      status,
      auction_ends_at,
      closed_at,
      bid_count,
      reserve_price_cents,
      carfax_clean,
      keys_count,
      has_lien,
      listing_media (
        public_url,
        is_cover,
        sort_order
      )
    `
      )
      .in("id", listingIds)
      .in("status", ["ACTIVE", "UNSEALED"]),
    ctx.supabase.rpc("get_dealership_listing_distances", {
      p_dealership_id: ctx.dealershipId,
      p_listing_ids: listingIds,
    }),
  ]);

  if (listingsRes.error) {
    throw new ExternalServiceError(
      "Unable to load auction lots for placed bids.",
      "EXTERNAL_SERVICE_ERROR",
      listingsRes.error
    );
  }

  const listings = listingsRes.data ?? [];
  const listingById = new Map(listings.map((row) => [row.id, row]));

  if (distancesRes.error) {
    logger.warn("PostGIS distance RPC fallback while loading active bids", {
      actorId: ctx.userId,
      meta: { code: distancesRes.error.code },
    });
  }

  const distanceByListingId = new Map<string, number>();
  for (const row of distancesRes.data ?? []) {
    if (row.distance_km !== null && row.distance_km !== undefined) {
      distanceByListingId.set(row.listing_id, row.distance_km);
    }
  }

  const items: DealerActiveBidItem[] = [];
  for (const bid of bids) {
    const listing = listingById.get(bid.listing_id);
    if (!listing) continue;

    const mediaRows = Array.isArray(listing.listing_media)
      ? listing.listing_media
      : [];
    const photos = sortPhotos(mediaRows);
    const auctionEndsAt =
      listing.auction_ends_at ?? listing.closed_at ?? nowIso;
    const endsAtMs = Date.parse(auctionEndsAt);

    let bidStanding: DealerActiveBidStanding;
    if (listing.status === "UNSEALED") {
      bidStanding = "AWAITING_SELLER";
    } else if (
      Number.isFinite(endsAtMs) &&
      endsAtMs > nowMs &&
      endsAtMs - nowMs < 60 * 60 * 1000
    ) {
      bidStanding = "CLOSING_SOON";
    } else if (listing.bid_count <= 1) {
      bidStanding = "SOLE_BIDDER";
    } else {
      bidStanding = "COMPETING";
    }

    items.push({
      id: listing.id,
      bidId: bid.id,
      bidStatus: bid.status,
      listingStatus: listing.status,
      revisionCount: bid.revision_count,
      placedAt: bid.revised_at ?? bid.created_at,
      bidStanding,
      vin: listing.vin,
      year: listing.year,
      make: listing.make,
      model: listing.model,
      trim: listing.trim || "",
      mileageKm: listing.mileage_km,
      bodyType: listing.body_type || "Passenger Vehicle",
      transmission: listing.transmission || "Automatic",
      drivetrain: listing.drivetrain || "AWD",
      exteriorColor: listing.exterior_color || "Not specified",
      interiorColor: listing.interior_color || "Not specified",
      province: listing.province,
      city: listing.city || listing.province,
      postalCode: listing.postal_code,
      distanceKm: distanceByListingId.get(listing.id) ?? 25,
      damageGrade: normalizeDamageGrade(listing.damage_grade),
      damageHotspotCount: listing.damage_hotspot_count,
      thumbnailUrl: photos[0] ?? DEFAULT_THUMBNAIL,
      photos,
      photosCount: mediaRows.length,
      auctionEndsAt,
      myCurrentBidCents: bid.amount_cents,
      totalBidsPlaced: listing.bid_count,
      reserveStatus: toReserveStatus(listing.reserve_price_cents),
      carfaxClean: listing.carfax_clean,
      keysCount: listing.keys_count,
      hasLien: listing.has_lien,
    });
  }

  return {
    items,
    summary: {
      totalCommittedCents: items.reduce(
        (sum, item) => sum + (item.myCurrentBidCents ?? 0),
        0
      ),
      activeBidsCount: items.length,
      closingSoonCount: items.filter(
        (item) => item.bidStanding === "CLOSING_SOON"
      ).length,
      awaitingSellerCount: items.filter(
        (item) => item.bidStanding === "AWAITING_SELLER"
      ).length,
    },
    dealershipName,
    serverTime: nowIso,
  };
}

type MatchedListingSummary = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage_km: number;
  damage_grade: string;
  city: string;
  province: string;
  postal_code: string;
  listing_media: Array<{
    public_url: string;
    is_cover: boolean;
    sort_order: number;
  }>;
};

async function hydrateWonMatchItems(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  dealership:
    | {
        operating_name: string;
        street_address: string;
        city: string;
        province: string;
      }
    | null
    | undefined,
  matches: MatchRow[],
  listings: MatchedListingSummary[]
): Promise<WonMatchItem[]> {
  if (matches.length === 0) return [];

  const sellerIds = Array.from(new Set(matches.map((m) => m.seller_id)));
  const { data: sellerRows } = await admin
    .from("profiles")
    .select(
      "id, first_name, last_name, email, phone_e164, city, province, postal_code, kyc_status"
    )
    .in("id", sellerIds);

  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const sellerMap = new Map(
    ((sellerRows ?? []) as SellerProfilePick[]).map((p) => [p.id, p])
  );
  const appointmentLocation = buildAppointmentLocation(dealership);

  return matches.map((match) => {
    const listing = listingMap.get(match.listing_id);
    const seller = sellerMap.get(match.seller_id);
    const photos = sortPhotos(
      Array.isArray(listing?.listing_media) ? listing.listing_media : []
    );

    const sellerName = seller
      ? `${seller.first_name} ${seller.last_name}`.trim() || seller.email
      : "Registered Seller";

    return {
      id: match.id,
      listingId: match.listing_id,
      voucherCode: match.voucher_code,
      vehicle: {
        vin: listing?.vin ?? "PENDING",
        year: listing?.year ?? 2022,
        make: listing?.make ?? "Vehicle",
        model: listing?.model ?? "Lot",
        trim: listing?.trim ?? "",
        mileageKm: listing?.mileage_km ?? 0,
        thumbnailUrl: photos[0] ?? DEFAULT_THUMBNAIL,
        damageGrade: normalizeDamageGrade(listing?.damage_grade ?? "A"),
        auctionId: match.listing_id,
      },
      seller: {
        name: sellerName,
        phone: formatPhoneDisplay(seller?.phone_e164 ?? null),
        email: seller?.email ?? "",
        city: listing?.city || seller?.city || "Toronto",
        province: listing?.province || seller?.province || "ON",
        postalCode: listing?.postal_code || seller?.postal_code || "",
        kycVerified: seller?.kyc_status === "VERIFIED",
      },
      acceptedBidAmountCents: match.agreed_amount_cents,
      wonAt: match.created_at,
      appointmentWindowExpiresAt: match.accept_expires_at,
      status: match.outcome,
      finalTransactionCents: match.final_price_cents,
      inspectionNotes: match.outcome_notes,
      outcomeLoggedAt: match.outcome_logged_at,
      appointmentLocation,
    };
  });
}

function summarizeWonMatches(items: WonMatchItem[]): DealerWonMatchesSummary {
  const completedItems = items.filter(
    (m) => m.status === "COMPLETED" || m.status === "RENEGOTIATED_LOWER"
  );
  return {
    totalWonValueCents: items.reduce(
      (sum, m) => sum + m.acceptedBidAmountCents,
      0
    ),
    totalWonCount: items.length,
    scheduledCount: items.filter(
      (m) => m.status === "APPOINTMENT_CONFIRMED"
    ).length,
    completedCount: completedItems.length,
    totalSettledValueCents: completedItems.reduce(
      (sum, m) => sum + (m.finalTransactionCents ?? m.acceptedBidAmountCents),
      0
    ),
  };
}

/**
 * Lists accepted matches won by the caller's dealership via RLS-scoped query,
 * unsealing matched seller contact details (FR-EU-10, FR-DL-09) strictly for those rows.
 */
export async function listDealerWonMatches(
  ctx: DealerContext
): Promise<DealerWonMatchesResponse> {
  const nowIso = new Date().toISOString();

  const [dealershipRes, matchesRes] = await Promise.all([
    ctx.supabase
      .from("dealerships")
      .select("operating_name, street_address, city, province")
      .eq("id", ctx.dealershipId)
      .maybeSingle(),
    ctx.supabase
      .from("matches")
      .select("*")
      .eq("dealership_id", ctx.dealershipId)
      .order("created_at", { ascending: false }),
  ]);

  if (matchesRes.error) {
    throw new ExternalServiceError(
      "Unable to load dealership won matches.",
      "EXTERNAL_SERVICE_ERROR",
      matchesRes.error
    );
  }

  const dealership = dealershipRes.data;
  const dealershipName = dealership?.operating_name ?? "Verified Dealership";
  const matches = matchesRes.data ?? [];

  if (matches.length === 0) {
    return {
      items: [],
      summary: summarizeWonMatches([]),
      dealershipName,
      serverTime: nowIso,
    };
  }

  const listingIds = Array.from(new Set(matches.map((m) => m.listing_id)));
  const { data: listingsRows, error: listingsErr } = await ctx.supabase
    .from("listings")
    .select(
      `
      id,
      vin,
      year,
      make,
      model,
      trim,
      mileage_km,
      damage_grade,
      city,
      province,
      postal_code,
      listing_media (
        public_url,
        is_cover,
        sort_order
      )
    `
    )
    .in("id", listingIds);

  if (listingsErr) {
    throw new ExternalServiceError(
      "Unable to load matched vehicle dossiers.",
      "EXTERNAL_SERVICE_ERROR",
      listingsErr
    );
  }

  const admin = createAdminSupabaseClient();
  const items = await hydrateWonMatchItems(
    admin,
    dealership,
    matches,
    (listingsRows ?? []) as MatchedListingSummary[]
  );

  return {
    items,
    summary: summarizeWonMatches(items),
    dealershipName,
    serverTime: nowIso,
  };
}

/**
 * Logs physical handover inspection & settlement outcomes (`COMPLETED`,
 * `RENEGOTIATED_LOWER`, `NO_SHOW`, `DECLINED_AFTER_INSPECTION`, or note update on
 * `APPOINTMENT_CONFIRMED`), transitioning `listings.status`, writing `audit_logs`,
 * and notifying the seller (FR-DL-10, BR-10, BR-11).
 */
export async function logMatchOutcome(
  ctx: DealerContext,
  matchId: string,
  input: LogMatchOutcomeInput,
  requestMeta: { ipAddress: string | null }
): Promise<LogMatchOutcomeResponse> {
  if (!UUID_REGEX.test(matchId)) {
    throw new NotFoundError("Won match record not found.");
  }

  const { data: match, error: matchErr } = await ctx.supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("dealership_id", ctx.dealershipId)
    .maybeSingle();

  if (matchErr) {
    throw new ExternalServiceError(
      "Unable to verify won match ownership.",
      "EXTERNAL_SERVICE_ERROR",
      matchErr
    );
  }

  if (!match) {
    throw new NotFoundError("Won match record not found.");
  }

  if (match.outcome !== "APPOINTMENT_CONFIRMED") {
    throw new ConflictError(
      `This handover outcome has already been finalized as ${match.outcome}.`,
      "MATCH_ALREADY_FINALIZED"
    );
  }

  const trimmedNotes = (input.notes ?? "").trim();
  let resolvedFinalPriceCents: number | null;
  let nextListingStatus: Database["public"]["Enums"]["listing_status"] | null =
    null;

  if (input.outcome === "COMPLETED") {
    resolvedFinalPriceCents =
      input.finalPriceCents ?? match.agreed_amount_cents;
    if (resolvedFinalPriceCents <= 0) {
      throw new ValidationError("Final settlement amount must exceed $0 CAD.", {
        finalPriceCents: "Enter a positive settlement amount in CAD.",
      });
    }
    nextListingStatus = "COMPLETED";
  } else if (input.outcome === "RENEGOTIATED_LOWER") {
    const candidate = input.finalPriceCents;
    if (
      candidate === undefined ||
      candidate === null ||
      candidate <= 0 ||
      candidate >= match.agreed_amount_cents
    ) {
      throw new ValidationError(
        "Renegotiated payout must be strictly below the agreed bid amount and greater than $0.",
        {
          finalPriceCents:
            "Enter an adjusted amount lower than the agreed offer.",
        }
      );
    }
    if (trimmedNotes.length < 5) {
      throw new ValidationError(
        "Inspection rationale (at least 5 characters) is required when adjusting the payout.",
        {
          notes: "Describe the hoist findings justifying this adjustment.",
        }
      );
    }
    resolvedFinalPriceCents = candidate;
    nextListingStatus = "COMPLETED";
  } else if (
    input.outcome === "DECLINED_AFTER_INSPECTION" ||
    input.outcome === "NO_SHOW"
  ) {
    if (trimmedNotes.length < 5) {
      throw new ValidationError(
        "A reason (at least 5 characters) is required when declining purchase or reporting a no-show.",
        {
          notes: "Provide clear handover or inspection findings.",
        }
      );
    }
    resolvedFinalPriceCents = 0;
    nextListingStatus = "UNSEALED";
    // TODO(senior-review): To allow secondary dealer selection after a declined/no-show match, convert UNIQUE(listing_id) on public.matches into a partial unique index for active/completed outcomes and update accept_dealer_bid().
  } else {
    resolvedFinalPriceCents = match.final_price_cents;
    nextListingStatus = null;
  }

  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();
  const isFinalizing = input.outcome !== "APPOINTMENT_CONFIRMED";

  const { data: updatedMatch, error: updateErr } = await admin
    .from("matches")
    .update({
      outcome: input.outcome,
      final_price_cents: resolvedFinalPriceCents,
      outcome_notes: trimmedNotes || match.outcome_notes,
      logged_by_user_id: ctx.userId,
      outcome_logged_at: isFinalizing ? nowIso : match.outcome_logged_at,
    })
    .eq("id", match.id)
    .eq("dealership_id", ctx.dealershipId)
    .eq("outcome", "APPOINTMENT_CONFIRMED")
    .select("*")
    .maybeSingle();

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to save handover outcome.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  if (!updatedMatch) {
    throw new ConflictError(
      "This match outcome was updated concurrently.",
      "MATCH_ALREADY_FINALIZED"
    );
  }

  let effectiveListingStatus = "ACCEPTED";
  if (nextListingStatus !== null) {
    const { data: updatedListing, error: listingErr } = await admin
      .from("listings")
      .update({ status: nextListingStatus })
      .eq("id", match.listing_id)
      .select("status")
      .maybeSingle();

    if (listingErr) {
      logger.error("Failed to transition listing status after match outcome", {
        actorId: ctx.userId,
        meta: { matchId: match.id, nextListingStatus, listingErr },
      });
    } else if (updatedListing) {
      effectiveListingStatus = updatedListing.status;
    }

    if (
      input.outcome === "DECLINED_AFTER_INSPECTION" ||
      input.outcome === "NO_SHOW"
    ) {
      await admin
        .from("bids")
        .update({ status: "EXPIRED" })
        .eq("id", match.winning_bid_id);
    }
  }

  const [dealershipRes, listingRes] = await Promise.all([
    admin
      .from("dealerships")
      .select("operating_name, street_address, city, province")
      .eq("id", ctx.dealershipId)
      .maybeSingle(),
    admin
      .from("listings")
      .select(
        `
        id,
        vin,
        year,
        make,
        model,
        trim,
        mileage_km,
        damage_grade,
        city,
        province,
        postal_code,
        listing_media (
          public_url,
          is_cover,
          sort_order
        )
      `
      )
      .eq("id", match.listing_id)
      .maybeSingle(),
  ]);

  const listingRow = listingRes.data as MatchedListingSummary | null;
  const dealership = dealershipRes.data;
  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  const { error: auditErr } = await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "MATCH_OUTCOME_LOGGED",
    entity_type: "match",
    entity_id: updatedMatch.id,
    provincial_jurisdiction: listingRow?.province ?? dealership?.province ?? "ON",
    ip_address: requestMeta.ipAddress,
    details:
      trimmedNotes ||
      `Dealership logged match outcome ${input.outcome} for voucher ${match.voucher_code}`,
    before_json: {
      outcome: match.outcome,
      finalPriceCents: match.final_price_cents,
    },
    after_json: {
      outcome: updatedMatch.outcome,
      finalPriceCents: updatedMatch.final_price_cents,
      listingStatus: effectiveListingStatus,
      voucherCode: updatedMatch.voucher_code,
    },
  });

  if (auditErr) {
    logger.error("Failed to write MATCH_OUTCOME_LOGGED audit log", {
      actorId: ctx.userId,
      meta: { matchId: updatedMatch.id, auditErr },
    });
  }

  try {
    // TODO(senior-review): Dispatch CASL-compliant seller payout/settlement email & SMS in Prompt B7.3.
    const vehicleLabel = listingRow
      ? `${listingRow.year} ${listingRow.make} ${listingRow.model}`
      : "your vehicle";
    const notifTitle =
      input.outcome === "COMPLETED"
        ? `Handover completed — ${vehicleLabel}`
        : input.outcome === "RENEGOTIATED_LOWER"
          ? `Adjusted settlement recorded — ${vehicleLabel}`
          : input.outcome === "APPOINTMENT_CONFIRMED"
            ? `Inspection note updated — ${vehicleLabel}`
            : `Dealership cancelled handover — ${vehicleLabel}`;
    const notifDesc =
      input.outcome === "COMPLETED"
        ? `Dealership confirmed inspection pass and authorized payout for voucher ${match.voucher_code}.`
        : trimmedNotes ||
          `Dealership recorded status ${input.outcome} for voucher ${match.voucher_code}.`;

    await admin.from("notifications").insert({
      user_id: match.seller_id,
      type: "MATCH",
      title: notifTitle,
      description: notifDesc,
      listing_id: match.listing_id,
      metadata: {
        matchId: updatedMatch.id,
        voucherCode: updatedMatch.voucher_code,
        outcome: updatedMatch.outcome,
        finalPriceCents: updatedMatch.final_price_cents,
      },
    });
  } catch (notifyErr) {
    logger.warn("Best-effort seller notification failed on match outcome log", {
      actorId: ctx.userId,
      meta: { matchId: updatedMatch.id, notifyErr },
    });
  }

  let linkedDisputeId: string | null = null;
  if (
    input.openDispute &&
    (input.outcome === "RENEGOTIATED_LOWER" ||
      input.outcome === "DECLINED_AFTER_INSPECTION")
  ) {
    const adjustmentDeltaCents =
      input.outcome === "RENEGOTIATED_LOWER" && resolvedFinalPriceCents !== null
        ? Math.max(0, match.agreed_amount_cents - resolvedFinalPriceCents)
        : 0;
    const summaryText =
      trimmedNotes.length >= 10
        ? trimmedNotes
        : `Post-inspection discrepancy logged under outcome ${input.outcome}.`;

    const opened = await openDispute(
      ctx,
      {
        matchId: updatedMatch.id,
        category: input.disputeCategory ?? "UNDERBODY_DAMAGE",
        disputedAdjustmentCents: adjustmentDeltaCents,
        allegationSummary: summaryText,
        hoistEvidenceNotes: trimmedNotes || summaryText,
        ...(input.technicianName
          ? { technicianName: input.technicianName }
          : {}),
        evidencePhotos: input.evidencePhotos ?? [],
      },
      requestMeta
    );
    linkedDisputeId = opened.id;
  }

  const [hydratedMatch] = await hydrateWonMatchItems(
    admin,
    dealership,
    [updatedMatch],
    listingRow ? [listingRow] : []
  );

  return {
    match: hydratedMatch,
    listingStatus: effectiveListingStatus,
    auditAction: "MATCH_OUTCOME_LOGGED",
    ...(linkedDisputeId ? { disputeId: linkedDisputeId } : {}),
    message: `Saved inspection outcome (${input.outcome}) for voucher ${updatedMatch.voucher_code}.`,
    serverTime: nowIso,
  };
}
