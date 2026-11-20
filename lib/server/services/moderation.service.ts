import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { notifyListingModerationDecision } from "@/lib/server/services/notification.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  ModerationDecisionAction,
  ModerationItem,
  ModerationPhoto,
  ModerationQueueCounts,
  ModerationQueueResponse,
  ModerationStatus,
} from "@/lib/types/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";
const FALLBACK_AUCTION_DURATION_HOURS = 24;

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type MediaRow = Database["public"]["Tables"]["listing_media"]["Row"];
type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export const moderationDecisionSchema = z
  .object({
    action: z.enum(["APPROVE", "REQUEST_EDITS", "REJECT"]),
    reason: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action !== "APPROVE" &&
      (!data.reason || data.reason.trim().length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Please provide a clear reason (at least 5 characters).",
      });
    }
  });

export type ModerationDecisionInput = z.output<typeof moderationDecisionSchema>;

function assertAdmin(ctx: SessionContext): void {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can moderate listings."
    );
  }
}

function formatRelativeSubmittedAt(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function mapListingStatusToModerationStatus(
  status: ListingRow["status"]
): ModerationStatus {
  if (status === "PENDING_MODERATION") return "PENDING";
  if (status === "EDITS_REQUESTED") return "EDITS_REQUESTED";
  if (status === "REJECTED") return "REJECTED";
  return "APPROVED";
}

async function readAuctionDurationHours(admin: AdminClient): Promise<number> {
  const { data } = await admin
    .from("platform_config")
    .select("value_json")
    .eq("key", "auction_duration_hours")
    .maybeSingle();

  const raw = data?.value_json;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return FALLBACK_AUCTION_DURATION_HOURS;
}

async function hydrateModerationItems(
  admin: AdminClient,
  listings: ListingRow[]
): Promise<ModerationItem[]> {
  if (listings.length === 0) return [];

  const listingIds = listings.map((l) => l.id);
  const sellerIds = Array.from(new Set(listings.map((l) => l.seller_id)));

  const [mediaRes, profilesRes] = await Promise.all([
    admin
      .from("listing_media")
      .select("*")
      .in("listing_id", listingIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true }),
    admin.from("profiles").select("*").in("id", sellerIds),
  ]);

  const mediaByListing = new Map<string, MediaRow[]>();
  for (const row of mediaRes.data ?? []) {
    const existing = mediaByListing.get(row.listing_id) ?? [];
    existing.push(row);
    mediaByListing.set(row.listing_id, existing);
  }

  const profileById = new Map<string, ProfileRow>();
  for (const profile of profilesRes.data ?? []) {
    profileById.set(profile.id, profile);
  }

  return listings.map((listing) => {
    const profile = profileById.get(listing.seller_id);
    const mediaRows = mediaByListing.get(listing.id) ?? [];

    const photos: ModerationPhoto[] = mediaRows.map((m, idx) => ({
      url: m.public_url,
      label: m.photo_label?.trim() || `Photo ${idx + 1}`,
    }));

    const thumbnailUrl = photos[0]?.url ?? DEFAULT_THUMBNAIL;
    const sellerName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
      : "Registered Seller";

    return {
      id: listing.id,
      submittedAt: formatRelativeSubmittedAt(listing.created_at),
      submittedAtIso: listing.created_at,
      listingStatus: listing.status,
      auctionEndsAt: listing.auction_ends_at,
      moderationNotes: listing.moderation_notes,
      seller: {
        id: listing.seller_id,
        name: sellerName,
        email: profile?.email ?? "",
        phone: profile?.phone_e164 ?? "Not provided",
        city: listing.city || profile?.city || listing.province,
        province: listing.province,
        kycStatus: profile?.kyc_status ?? "NOT_STARTED",
      },
      vehicle: {
        vin: listing.vin,
        year: listing.year,
        make: listing.make,
        model: listing.model,
        trim: listing.trim,
        mileageKm: listing.mileage_km,
        engineSpec: listing.engine_spec ?? undefined,
        transmission: listing.transmission ?? "Automatic",
        drivetrain: listing.drivetrain ?? "AWD",
        reservePriceCents: listing.reserve_price_cents ?? 0,
        damageGrade: listing.damage_grade,
        damageHotspotCount: listing.damage_hotspot_count,
        photosCount: photos.length,
        thumbnailUrl,
        photos,
        lienDisclosed: listing.has_lien,
        lienHolder: listing.lien_details || undefined,
        keysCount: listing.keys_count,
        sellerNotes:
          listing.seller_notes ||
          listing.service_history_notes ||
          "No additional seller notes provided.",
        carfaxSummary: {
          owners: 1,
          accidents: listing.accident_count ?? 0,
          serviceRecords: 0,
        },
      },
      checks: {
        vinDecoded: Boolean(listing.make && listing.model && listing.year),
        odometerLegible: photos.length > 0,
        damageMapped: listing.declaration_accurate_condition,
        ownershipVerified:
          profile?.kyc_status === "VERIFIED" &&
          listing.declaration_owner_attested,
      },
      status: mapListingStatusToModerationStatus(listing.status),
    };
  });
}

/**
 * Lists all non-draft, non-cancelled vehicle listings in newest-first order
 * for Administrator compliance moderation (FR-AD-03).
 */
export async function listModerationQueue(
  ctx: SessionContext
): Promise<ModerationQueueResponse> {
  assertAdmin(ctx);
  const admin = createAdminSupabaseClient();

  const { data: listings, error } = await admin
    .from("listings")
    .select("*")
    .neq("status", "DRAFT")
    .neq("status", "CANCELLED")
    .order("created_at", { ascending: false });

  if (error) {
    throw new ExternalServiceError(
      "Unable to load listing moderation queue.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const items = await hydrateModerationItems(admin, listings ?? []);
  const counts: ModerationQueueCounts = {
    ALL: items.length,
    PENDING: items.filter((item) => item.status === "PENDING").length,
    EDITS_REQUESTED: items.filter(
      (item) => item.status === "EDITS_REQUESTED"
    ).length,
    APPROVED: items.filter((item) => item.status === "APPROVED").length,
    REJECTED: items.filter((item) => item.status === "REJECTED").length,
  };

  return { items, counts };
}

/**
 * Loads full Admin inspection dossier for a single listing submission.
 */
export async function getModerationDossier(
  ctx: SessionContext,
  listingId: string
): Promise<ModerationItem> {
  assertAdmin(ctx);
  if (!UUID_REGEX.test(listingId)) {
    throw new NotFoundError("Listing submission not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: listing, error } = await admin
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    throw new ExternalServiceError(
      "Unable to load moderation dossier.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  if (!listing) {
    throw new NotFoundError("Listing submission not found.");
  }

  const [hydrated] = await hydrateModerationItems(admin, [listing]);
  return hydrated;
}

/**
 * Applies an Admin moderation decision (`APPROVE`, `REQUEST_EDITS`, `REJECT`).
 * Approval sets `ACTIVE`, starts the `platform_config.auction_duration_hours` 24h clock,
 * logs to immutable `audit_logs`, and notifies the seller (FR-AD-03, BR-03, FR-AD-09).
 */
export async function decideListing(
  ctx: SessionContext,
  listingId: string,
  input: ModerationDecisionInput,
  requestMeta: { ipAddress: string | null }
): Promise<ModerationItem> {
  assertAdmin(ctx);
  if (!UUID_REGEX.test(listingId)) {
    throw new NotFoundError("Listing submission not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: existing, error: fetchErr } = await admin
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr) {
    throw new ExternalServiceError(
      "Unable to load listing for moderation.",
      "EXTERNAL_SERVICE_ERROR",
      fetchErr
    );
  }

  if (!existing) {
    throw new NotFoundError("Listing submission not found.");
  }

  if (
    existing.status !== "PENDING_MODERATION" &&
    existing.status !== "EDITS_REQUESTED"
  ) {
    throw new ConflictError(
      `Listing cannot be moderated from status ${existing.status}.`,
      "INVALID_STATUS_TRANSITION"
    );
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const action: ModerationDecisionAction = input.action;

  let nextStatus: Database["public"]["Enums"]["listing_status"];
  let auctionStartedAt: string | null = null;
  let auctionEndsAt: string | null = null;
  let auditAction: string;

  if (action === "APPROVE") {
    const durationHours = await readAuctionDurationHours(admin);
    nextStatus = "ACTIVE";
    auctionStartedAt = nowIso;
    auctionEndsAt = new Date(
      nowMs + durationHours * 60 * 60 * 1000
    ).toISOString();
    auditAction = "LISTING_APPROVED";
  } else if (action === "REQUEST_EDITS") {
    nextStatus = "EDITS_REQUESTED";
    auditAction = "LISTING_EDITS_REQUESTED";
  } else {
    nextStatus = "REJECTED";
    auditAction = "LISTING_REJECTED";
  }

  const updatePayload: Database["public"]["Tables"]["listings"]["Update"] = {
    status: nextStatus,
    moderated_by: ctx.userId,
    moderated_at: nowIso,
    moderation_notes: input.reason?.trim() || null,
    ...(auctionStartedAt ? { auction_started_at: auctionStartedAt } : {}),
    ...(auctionEndsAt ? { auction_ends_at: auctionEndsAt } : {}),
  };

  const { data: updated, error: updateErr } = await admin
    .from("listings")
    .update(updatePayload)
    .eq("id", existing.id)
    .in("status", ["PENDING_MODERATION", "EDITS_REQUESTED"])
    .select("*")
    .maybeSingle();

  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to save moderation decision.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  if (!updated) {
    throw new ConflictError(
      "Listing was already moderated by another administrator.",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: auditAction,
    entity_type: "listing",
    entity_id: updated.id,
    provincial_jurisdiction: updated.province,
    ip_address: requestMeta.ipAddress,
    details: input.reason?.trim() || null,
    before_json: {
      status: existing.status,
      moderationNotes: existing.moderation_notes,
    },
    after_json: {
      status: updated.status,
      moderatedBy: ctx.userId,
      auctionStartedAt: updated.auction_started_at,
      auctionEndsAt: updated.auction_ends_at,
      moderationNotes: updated.moderation_notes,
    },
  });

  try {
    await notifyListingModerationDecision({
      listingId: updated.id,
      sellerId: existing.seller_id,
      vin: existing.vin,
      vehicleLabel: `${existing.year} ${existing.make} ${existing.model}`,
      status: updated.status,
      action,
      reason: input.reason,
      auctionEndsAt: updated.auction_ends_at,
    });
  } catch (notifyErr) {
    logger.warn("Best-effort moderation notification fan-out failed", {
      actorId: ctx.userId,
      meta: { listingId: updated.id, action, notifyErr },
    });
  }

  const [hydrated] = await hydrateModerationItems(admin, [updated]);
  return hydrated;
}
