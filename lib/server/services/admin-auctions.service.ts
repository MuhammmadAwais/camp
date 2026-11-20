import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import {
  notifyAuctionClosed,
  notifyAuctionExtended,
  notifyAuctionHalted,
} from "@/lib/server/services/notification.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AdminAuctionLot,
  AdminAuctionOverrideResult,
  AdminAuctionsResponse,
  AdminAuctionsSummary,
  AdminAuctionStatus,
} from "@/lib/types/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";

const OPERATIONAL_AUCTION_STATUSES: readonly AdminAuctionStatus[] = [
  "ACTIVE",
  "UNSEALED",
  "ACCEPTED",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
];

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;
type MediaRow = Pick<
  Database["public"]["Tables"]["listing_media"]["Row"],
  "listing_id" | "public_url" | "is_cover" | "sort_order"
>;
type BidEstimateRow = Pick<
  Database["public"]["Tables"]["bids"]["Row"],
  "listing_id" | "amount_cents"
>;
type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export const adminAuctionOverrideSchema = z
  .object({
    action: z.enum(["EXTEND", "FORCE_CLOSE", "HALT"]),
    reason: z
      .string()
      .trim()
      .min(5, "Audit rationale must be at least 5 characters.")
      .max(1000, "Audit rationale cannot exceed 1,000 characters."),
    extensionHours: z
      .number()
      .int("Extension hours must be a whole number.")
      .min(1, "Extension must be at least 1 hour.")
      .max(72, "Extension cannot exceed 72 hours at once.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "EXTEND" && data.extensionHours === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["extensionHours"],
        message: "Extension duration (hours) is required to extend an auction.",
      });
    }
  });

export type AdminAuctionOverrideInput = z.output<
  typeof adminAuctionOverrideSchema
>;

function assertAdmin(ctx: SessionContext): void {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can supervise or override auctions."
    );
  }
}

function normalizeAdminAuctionStatus(
  status: ListingRow["status"]
): AdminAuctionStatus {
  const matched = OPERATIONAL_AUCTION_STATUSES.find((s) => s === status);
  return matched ?? "UNSEALED";
}

function resolveActorName(ctx: SessionContext): string {
  return (
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email
  );
}

async function fetchListingOrThrow(
  admin: AdminClient,
  listingId: string
): Promise<ListingRow> {
  if (!UUID_REGEX.test(listingId)) {
    throw new NotFoundError("Auction lot not found.");
  }

  const { data: existing, error } = await admin
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    throw new ExternalServiceError(
      "Unable to load auction lot.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  if (!existing) {
    throw new NotFoundError("Auction lot not found.");
  }

  return existing;
}

async function hydrateAdminAuctionLots(
  admin: AdminClient,
  listings: ListingRow[]
): Promise<AdminAuctionLot[]> {
  if (listings.length === 0) return [];

  const listingIds = listings.map((l) => l.id);
  const sellerIds = Array.from(new Set(listings.map((l) => l.seller_id)));

  const [mediaRes, profilesRes, bidsRes] = await Promise.all([
    admin
      .from("listing_media")
      .select("listing_id, public_url, is_cover, sort_order")
      .in("listing_id", listingIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true }),
    admin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", sellerIds),
    admin
      .from("bids")
      .select("listing_id, amount_cents")
      .in("listing_id", listingIds)
      .neq("status", "VOIDED"),
  ]);

  const thumbByListing = new Map<string, string>();
  for (const row of (mediaRes.data ?? []) as MediaRow[]) {
    if (!thumbByListing.has(row.listing_id)) {
      thumbByListing.set(row.listing_id, row.public_url);
    }
  }

  const profileById = new Map<string, ProfileRow>();
  for (const profile of (profilesRes.data ?? []) as ProfileRow[]) {
    profileById.set(profile.id, profile);
  }

  const highestBidByListing = new Map<string, number>();
  for (const bid of (bidsRes.data ?? []) as BidEstimateRow[]) {
    const current = highestBidByListing.get(bid.listing_id) ?? 0;
    if (bid.amount_cents > current) {
      highestBidByListing.set(bid.listing_id, bid.amount_cents);
    }
  }

  return listings.map((listing) => {
    const profile = profileById.get(listing.seller_id);
    const sellerName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
      : "Registered Seller";

    const highestBid = highestBidByListing.get(listing.id);

    return {
      id: listing.id,
      vin: listing.vin,
      year: listing.year,
      make: listing.make,
      model: listing.model,
      trim: listing.trim,
      sellerName,
      city: listing.city || listing.province,
      province: listing.province,
      status: normalizeAdminAuctionStatus(listing.status),
      totalBidsCount: listing.bid_count,
      reservePriceCents: listing.reserve_price_cents ?? 0,
      ...(highestBid !== undefined
        ? { highestBidEstimateCents: highestBid }
        : {}),
      endsAt: listing.auction_ends_at ?? listing.closed_at ?? listing.created_at,
      closedAt: listing.closed_at,
      thumbnailUrl: thumbByListing.get(listing.id) ?? DEFAULT_THUMBNAIL,
    };
  });
}

function computeAuctionSummary(
  items: AdminAuctionLot[],
  nowMs: number
): AdminAuctionsSummary {
  const activeCount = items.filter((l) => l.status === "ACTIVE").length;
  const urgentCount = items.filter((l) => {
    if (l.status !== "ACTIVE") return false;
    const diff = Date.parse(l.endsAt) - nowMs;
    return Number.isFinite(diff) && diff > 0 && diff < 60 * 60 * 1000;
  }).length;
  const unsealedCount = items.filter((l) => l.status === "UNSEALED").length;
  const acceptedCount = items.filter(
    (l) => l.status === "ACCEPTED" || l.status === "COMPLETED"
  ).length;

  return {
    activeCount,
    urgentCount,
    unsealedCount,
    acceptedCount,
    totalCount: items.length,
  };
}

/**
 * Lists all operational auctions (ACTIVE, UNSEALED, ACCEPTED, COMPLETED, EXPIRED, CANCELLED)
 * for Platform Administrator surveillance & manual overrides (FR-AD-04).
 */
export async function listAllAuctions(
  ctx: SessionContext
): Promise<AdminAuctionsResponse> {
  assertAdmin(ctx);
  const admin = createAdminSupabaseClient();

  const { data: listings, error } = await admin
    .from("listings")
    .select("*")
    .in("status", [...OPERATIONAL_AUCTION_STATUSES])
    .order("created_at", { ascending: false });

  if (error) {
    throw new ExternalServiceError(
      "Unable to load platform auctions.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const items = await hydrateAdminAuctionLots(admin, listings ?? []);
  const nowMs = Date.now();

  return {
    items,
    summary: computeAuctionSummary(items, nowMs),
    serverTime: new Date(nowMs).toISOString(),
  };
}

/**
 * Extends an active auction's end timestamp by 1–72 hours with mandatory audit logging.
 */
export async function extendAuction(
  ctx: SessionContext,
  listingId: string,
  hours: number,
  reason: string,
  requestMeta: { ipAddress: string | null }
): Promise<AdminAuctionOverrideResult> {
  assertAdmin(ctx);
  const admin = createAdminSupabaseClient();
  const existing = await fetchListingOrThrow(admin, listingId);

  if (existing.status !== "ACTIVE") {
    throw new ConflictError(
      `Only ACTIVE auctions can be extended (current: ${existing.status}).`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const nowMs = Date.now();
  const currentEndMs = existing.auction_ends_at
    ? Date.parse(existing.auction_ends_at)
    : nowMs;
  const baseMs = Math.max(
    nowMs,
    Number.isFinite(currentEndMs) ? currentEndMs : nowMs
  );
  const newEndsAt = new Date(baseMs + hours * 3_600_000).toISOString();

  const { data: updated, error: updateErr } = await admin
    .from("listings")
    .update({ auction_ends_at: newEndsAt })
    .eq("id", existing.id)
    .eq("status", "ACTIVE")
    .select("*")
    .maybeSingle();

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to extend auction countdown.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  if (!updated) {
    throw new ConflictError(
      "Auction status changed concurrently before extension completed.",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const trimmedReason = reason.trim();
  const actorName = resolveActorName(ctx);

  const { error: auditErr } = await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "AUCTION_EXTENDED",
    entity_type: "listing",
    entity_id: updated.id,
    provincial_jurisdiction: updated.province,
    ip_address: requestMeta.ipAddress,
    details: trimmedReason,
    before_json: {
      status: existing.status,
      auctionEndsAt: existing.auction_ends_at,
    },
    after_json: {
      status: updated.status,
      auctionEndsAt: updated.auction_ends_at,
      extensionHours: hours,
    },
  });

  if (auditErr) {
    logger.error("Failed to write AUCTION_EXTENDED audit log", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, auditErr },
    });
  }

  try {
    await notifyAuctionExtended({
      listingId: updated.id,
      sellerId: existing.seller_id,
      vehicleLabel: `${existing.year} ${existing.make} ${existing.model}`,
      hours,
      reason: trimmedReason,
      auctionEndsAt: updated.auction_ends_at,
    });
  } catch (notifyErr) {
    logger.warn("Best-effort seller notification failed on auction extend", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, notifyErr },
    });
  }

  const [lot] = await hydrateAdminAuctionLots(admin, [updated]);
  return {
    lot,
    action: "EXTEND",
    auditAction: "AUCTION_EXTENDED",
    message: `Extended ${updated.year} ${updated.make} ${updated.model} countdown by +${hours}h.`,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Immediately force-closes an ACTIVE auction and transitions it to UNSEALED
 * so ranked dealer offers can be reviewed and accepted (FR-AD-04, ops/demo).
 */
export async function forceCloseAuction(
  ctx: SessionContext,
  listingId: string,
  reason: string,
  requestMeta: { ipAddress: string | null }
): Promise<AdminAuctionOverrideResult> {
  assertAdmin(ctx);
  const admin = createAdminSupabaseClient();
  const existing = await fetchListingOrThrow(admin, listingId);

  if (existing.status !== "ACTIVE") {
    throw new ConflictError(
      `Only ACTIVE auctions can be force-closed (current: ${existing.status}).`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updateErr } = await admin
    .from("listings")
    .update({ status: "UNSEALED", closed_at: nowIso })
    .eq("id", existing.id)
    .eq("status", "ACTIVE")
    .select("*")
    .maybeSingle();

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to force-close active auction.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  if (!updated) {
    throw new ConflictError(
      "Auction status changed concurrently before force-close completed.",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const trimmedReason = reason.trim();
  const actorName = resolveActorName(ctx);

  const { error: auditErr } = await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "AUCTION_FORCE_CLOSED",
    entity_type: "listing",
    entity_id: updated.id,
    provincial_jurisdiction: updated.province,
    ip_address: requestMeta.ipAddress,
    details: trimmedReason,
    before_json: {
      status: existing.status,
      auctionEndsAt: existing.auction_ends_at,
      closedAt: existing.closed_at,
    },
    after_json: {
      status: updated.status,
      closedAt: updated.closed_at,
      bidCount: updated.bid_count,
    },
  });

  if (auditErr) {
    logger.error("Failed to write AUCTION_FORCE_CLOSED audit log", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, auditErr },
    });
  }

  try {
    await notifyAuctionClosed({
      listingId: updated.id,
      sellerId: existing.seller_id,
      vehicleLabel: `${updated.year} ${updated.make} ${updated.model}`,
      bidCount: updated.bid_count,
      status: updated.status,
      source: "FORCE_CLOSE",
    });
  } catch (notifyErr) {
    logger.warn("Best-effort notifications failed on auction force-close", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, notifyErr },
    });
  }

  const [lot] = await hydrateAdminAuctionLots(admin, [updated]);
  return {
    lot,
    action: "FORCE_CLOSE",
    auditAction: "AUCTION_FORCE_CLOSED",
    message: `Force-closed and unsealed ${updated.year} ${updated.make} ${updated.model} (${updated.bid_count} sealed bid(s) revealed to seller).`,
    serverTime: nowIso,
  };
}

/**
 * Permanently halts an ACTIVE or UNSEALED auction (`CANCELLED`), voids all
 * active/expired bids on the lot, and writes a statutory cancellation audit record.
 */
export async function haltAuction(
  ctx: SessionContext,
  listingId: string,
  reason: string,
  requestMeta: { ipAddress: string | null }
): Promise<AdminAuctionOverrideResult> {
  assertAdmin(ctx);
  const admin = createAdminSupabaseClient();
  const existing = await fetchListingOrThrow(admin, listingId);

  if (existing.status !== "ACTIVE" && existing.status !== "UNSEALED") {
    throw new ConflictError(
      `Only ACTIVE or UNSEALED auctions can be halted (current: ${existing.status}).`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const nowIso = new Date().toISOString();
  const trimmedReason = reason.trim();

  const { data: updated, error: updateErr } = await admin
    .from("listings")
    .update({
      status: "CANCELLED",
      closed_at: existing.closed_at ?? nowIso,
      moderation_notes: trimmedReason,
    })
    .eq("id", existing.id)
    .in("status", ["ACTIVE", "UNSEALED"])
    .select("*")
    .maybeSingle();

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to halt auction lot.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  if (!updated) {
    throw new ConflictError(
      "Auction status changed concurrently before halt completed.",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const { data: voidedBids, error: voidErr } = await admin
    .from("bids")
    .update({ status: "VOIDED" })
    .eq("listing_id", updated.id)
    .in("status", ["ACTIVE", "EXPIRED"])
    .select("dealership_id");

  if (voidErr) {
    logger.error("Failed to void bids while halting auction", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, voidErr },
    });
  }

  const actorName = resolveActorName(ctx);
  const voidedCount = voidedBids?.length ?? 0;

  const { error: auditErr } = await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "AUCTION_HALTED",
    entity_type: "listing",
    entity_id: updated.id,
    provincial_jurisdiction: updated.province,
    ip_address: requestMeta.ipAddress,
    details: trimmedReason,
    before_json: {
      status: existing.status,
      bidCount: existing.bid_count,
    },
    after_json: {
      status: updated.status,
      closedAt: updated.closed_at,
      voidedBidsCount: voidedCount,
    },
  });

  if (auditErr) {
    logger.error("Failed to write AUCTION_HALTED audit log", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, auditErr },
    });
  }

  try {
    const dealershipIds = Array.from(
      new Set((voidedBids ?? []).map((b) => b.dealership_id))
    );
    await notifyAuctionHalted({
      listingId: updated.id,
      sellerId: existing.seller_id,
      vehicleLabel: `${updated.year} ${updated.make} ${updated.model}`,
      reason: trimmedReason,
      voidedBidsCount: voidedCount,
      voidedDealershipIds: dealershipIds,
    });
  } catch (notifyErr) {
    logger.warn("Best-effort notifications failed on auction halt", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, notifyErr },
    });
  }

  const [lot] = await hydrateAdminAuctionLots(admin, [updated]);
  return {
    lot,
    action: "HALT",
    auditAction: "AUCTION_HALTED",
    message: `Halted ${updated.year} ${updated.make} ${updated.model} and voided ${voidedCount} bid(s).`,
    serverTime: nowIso,
  };
}
