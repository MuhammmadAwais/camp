import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type {
  PrivacyExportBundle,
  RequestAccountDeletionResponse,
} from "@/lib/types/settings";

const UNSEALED_BID_VISIBILITY_STATUSES = new Set([
  "UNSEALED",
  "ACCEPTED",
  "COMPLETED",
  "EXPIRED",
]);

const GRACE_PERIOD_DAYS = 30;

export const requestAccountDeletionSchema = z.object({
  confirmationText: z.literal("DELETE MY ACCOUNT", {
    message: 'Type exact confirmation phrase "DELETE MY ACCOUNT" to proceed.',
  }),
  reason: z.string().trim().max(500).optional(),
});

export type RequestAccountDeletionInput = z.output<
  typeof requestAccountDeletionSchema
>;

/**
 * Generates a PIPEDA & Quebec Law 25 compliant JSON portability archive
 * strictly scoped to the authenticated user's own data.
 * Preserves the H1 / BR-04 Sealed-Bid Secrecy invariant at all times.
 */
export async function exportPersonalData(
  ctx: SessionContext,
  meta: { ipAddress: string | null }
): Promise<PrivacyExportBundle> {
  const admin = createAdminSupabaseClient();
  const isDealer =
    (ctx.role === "DEALER_ADMIN" || ctx.role === "DEALER_AGENT") &&
    Boolean(ctx.dealershipId);

  const [consentsRes, kycRes, listingsRes, disputesRes, notificationsRes] =
    await Promise.all([
      admin
        .from("user_consents")
        .select("id, consent_type, granted, policy_version, recorded_at")
        .eq("user_id", ctx.userId)
        .order("recorded_at", { ascending: false }),
      admin
        .from("kyc_submissions")
        .select("status, id_doc_type, provider, submitted_at, verified_at, expires_at")
        .eq("user_id", ctx.userId)
        .maybeSingle(),
      admin
        .from("listings")
        .select(
          "id, vin, year, make, model, trim, mileage_km, status, reserve_price_cents, city, province, postal_code, bid_count, created_at, auction_started_at, auction_ends_at, closed_at"
        )
        .eq("seller_id", ctx.userId)
        .order("created_at", { ascending: false }),
      admin
        .from("disputes")
        .select(
          "id, match_id, category, status, allegation_summary, compliance_decision_notes, created_at, resolved_at"
        )
        .eq("raised_by_user_id", ctx.userId)
        .order("created_at", { ascending: false }),
      admin
        .from("notifications")
        .select("id, type, title, description, read, created_at")
        .eq("user_id", ctx.userId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (
    consentsRes.error ||
    kycRes.error ||
    listingsRes.error ||
    disputesRes.error ||
    notificationsRes.error
  ) {
    throw new ExternalServiceError(
      "Unable to compile personal data export archive right now.",
      "EXTERNAL_SERVICE_ERROR",
      consentsRes.error ??
        kycRes.error ??
        listingsRes.error ??
        disputesRes.error ??
        notificationsRes.error
    );
  }

  const listingRows = listingsRes.data ?? [];
  const allListingIds = listingRows.map((row) => row.id);
  const unsealedListingIds = listingRows
    .filter((row) => UNSEALED_BID_VISIBILITY_STATUSES.has(row.status))
    .map((row) => row.id);

  const [mediaRes, hotspotsRes, unsealedSellerBidsRes, dealerBidsRes, sellerMatchesRes, dealerMatchesRes] =
    await Promise.all([
      allListingIds.length > 0
        ? admin
            .from("listing_media")
            .select("listing_id, storage_key, photo_label, sort_order")
            .in("listing_id", allListingIds)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      allListingIds.length > 0
        ? admin
            .from("damage_hotspots")
            .select("listing_id, viewpoint, panel, severity, description")
            .in("listing_id", allListingIds)
        : Promise.resolve({ data: [], error: null }),
      unsealedListingIds.length > 0
        ? admin
            .from("bids")
            .select(
              "id, listing_id, dealership_id, amount_cents, status, conditions, version, revision_count, created_at, revised_at"
            )
            .in("listing_id", unsealedListingIds)
            .order("amount_cents", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      isDealer && ctx.dealershipId
        ? admin
            .from("bids")
            .select(
              "id, listing_id, dealership_id, amount_cents, status, conditions, version, revision_count, created_at, revised_at"
            )
            .eq("dealership_id", ctx.dealershipId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      admin
        .from("matches")
        .select(
          "id, listing_id, dealership_id, voucher_code, selection_reason, agreed_amount_cents, final_price_cents, accept_expires_at, outcome, outcome_logged_at, created_at"
        )
        .eq("seller_id", ctx.userId)
        .order("created_at", { ascending: false }),
      isDealer && ctx.dealershipId
        ? admin
            .from("matches")
            .select(
              "id, listing_id, dealership_id, voucher_code, selection_reason, agreed_amount_cents, final_price_cents, accept_expires_at, outcome, outcome_logged_at, created_at"
            )
            .eq("dealership_id", ctx.dealershipId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (
    mediaRes.error ||
    hotspotsRes.error ||
    unsealedSellerBidsRes.error ||
    dealerBidsRes.error ||
    sellerMatchesRes.error ||
    dealerMatchesRes.error
  ) {
    throw new ExternalServiceError(
      "Unable to retrieve vehicle and transaction records for data export.",
      "EXTERNAL_SERVICE_ERROR"
    );
  }

  const mediaByListing = new Map<
    string,
    Array<{ storagePath: string; angleTag: string | null; position: number }>
  >();
  for (const row of mediaRes.data ?? []) {
    const list = mediaByListing.get(row.listing_id) ?? [];
    list.push({
      storagePath: row.storage_key,
      angleTag: row.photo_label,
      position: row.sort_order,
    });
    mediaByListing.set(row.listing_id, list);
  }

  const hotspotsByListing = new Map<
    string,
    Array<{ zone: string; severity: string; notes: string | null }>
  >();
  for (const row of hotspotsRes.data ?? []) {
    const list = hotspotsByListing.get(row.listing_id) ?? [];
    list.push({
      zone: `${row.viewpoint}: ${row.panel}`,
      severity: row.severity,
      notes: row.description,
    });
    hotspotsByListing.set(row.listing_id, list);
  }

  const bidMap = new Map<
    string,
    PrivacyExportBundle["bids"][number]
  >();
  for (const b of [...(unsealedSellerBidsRes.data ?? []), ...(dealerBidsRes.data ?? [])]) {
    if (!bidMap.has(b.id)) {
      bidMap.set(b.id, {
        id: b.id,
        listingId: b.listing_id,
        dealershipId: b.dealership_id,
        amountCents: b.amount_cents,
        status: b.status,
        conditions: b.conditions,
        version: b.version,
        revisionCount: b.revision_count,
        createdAt: b.created_at,
        revisedAt: b.revised_at,
      });
    }
  }

  const matchMap = new Map<
    string,
    PrivacyExportBundle["matches"][number]
  >();
  for (const m of [...(sellerMatchesRes.data ?? []), ...(dealerMatchesRes.data ?? [])]) {
    if (!matchMap.has(m.id)) {
      matchMap.set(m.id, {
        id: m.id,
        listingId: m.listing_id,
        dealershipId: m.dealership_id,
        voucherCode: m.voucher_code,
        selectionReason: m.selection_reason,
        agreedAmountCents: m.agreed_amount_cents,
        finalPriceCents: m.final_price_cents,
        acceptExpiresAt: m.accept_expires_at,
        outcome: m.outcome,
        outcomeLoggedAt: m.outcome_logged_at,
        createdAt: m.created_at,
      });
    }
  }

  const consents = (consentsRes.data ?? []).map((c) => ({
    id: c.id,
    consentType: c.consent_type,
    granted: c.granted,
    policyVersion: c.policy_version,
    recordedAt: c.recorded_at,
  }));

  const listings: PrivacyExportBundle["listings"] = listingRows.map((l) => ({
    id: l.id,
    vin: l.vin,
    year: l.year,
    make: l.make,
    model: l.model,
    trim: l.trim,
    mileageKm: l.mileage_km,
    status: l.status,
    reservePriceCents: l.reserve_price_cents,
    city: l.city,
    province: l.province,
    postalCode: l.postal_code,
    bidCount: l.bid_count,
    createdAt: l.created_at,
    auctionStartedAt: l.auction_started_at,
    auctionEndsAt: l.auction_ends_at,
    closedAt: l.closed_at,
    media: mediaByListing.get(l.id) ?? [],
    damageHotspots: hotspotsByListing.get(l.id) ?? [],
  }));

  const bids = Array.from(bidMap.values());
  const matches = Array.from(matchMap.values());

  const disputes = (disputesRes.data ?? []).map((d) => ({
    id: d.id,
    matchId: d.match_id,
    category: d.category,
    status: d.status,
    description: d.allegation_summary,
    resolutionNotes: d.compliance_decision_notes,
    createdAt: d.created_at,
    resolvedAt: d.resolved_at,
  }));

  const notifications = (notificationsRes.data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    description: n.description,
    read: n.read,
    createdAt: n.created_at,
  }));

  const counts = {
    consents: consents.length,
    listings: listings.length,
    bids: bids.length,
    matches: matches.length,
    disputes: disputes.length,
    notifications: notifications.length,
  };

  const fullName = `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim();
  const actorName = fullName || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "PRIVACY_DATA_EXPORTED",
    entity_type: "PROFILE",
    entity_id: ctx.userId,
    provincial_jurisdiction: ctx.profile.province ?? "ON",
    ip_address: meta.ipAddress,
    details: "Generated PIPEDA / Quebec Law 25 personal data portability JSON export",
    after_json: {
      schemaVersion: "autonexa-pipeda-law25-v1",
      counts,
    } as unknown as Json,
  });

  return {
    schemaVersion: "autonexa-pipeda-law25-v1",
    exportedAt: new Date().toISOString(),
    legalBasis:
      "PIPEDA Principle 4.9 (Individual Access) & Quebec Act respecting the protection of personal information in the private sector (Law 25)",
    dataResidency: "ca-central-1 (Montreal, Canada)",
    retentionNotice:
      "Competitor sealed bids on ACTIVE auctions remain cryptographically sealed under H1/BR-04; statutory audit records are retained for 7 years.",
    subject: {
      id: ctx.profile.id,
      email: ctx.profile.email,
      firstName: ctx.profile.first_name,
      lastName: ctx.profile.last_name,
      fullName: fullName || ctx.email,
      phoneE164: ctx.profile.phone_e164,
      postalCode: ctx.profile.postal_code,
      city: ctx.profile.city,
      province: ctx.profile.province,
      languagePref: ctx.profile.language_pref,
      role: ctx.profile.role,
      kycStatus: ctx.profile.kyc_status,
      accountStatus: ctx.profile.account_status,
      dealershipId: ctx.profile.dealership_id,
      marketingOptIn: ctx.profile.marketing_opt_in,
      mfaEnabled: ctx.profile.mfa_enabled,
      jobTitle: ctx.profile.job_title,
      regulatorBoardId: ctx.profile.regulator_board_id,
      createdAt: ctx.profile.created_at,
      deletionRequestedAt: ctx.profile.deletion_requested_at,
    },
    consents,
    kyc: kycRes.data
      ? {
          status: kycRes.data.status,
          idDocType: kycRes.data.id_doc_type,
          provider: kycRes.data.provider,
          submittedAt: kycRes.data.submitted_at,
          verifiedAt: kycRes.data.verified_at,
          expiresAt: kycRes.data.expires_at,
        }
      : null,
    listings,
    bids,
    matches,
    disputes,
    notifications,
    counts,
  };
}

/**
 * Schedules a 30-day PIPEDA / Quebec Law 25 account erasure workflow after verifying
 * no active auctions, confirmed handover vouchers, or open arbitration disputes remain.
 */
export async function requestAccountDeletion(
  ctx: SessionContext,
  input: RequestAccountDeletionInput,
  meta: { ipAddress: string | null; userAgent: string | null }
): Promise<RequestAccountDeletionResponse> {
  if (ctx.role === "ADMIN") {
    throw new ForbiddenError(
      "Platform administrator accounts cannot be self-deleted via the privacy self-service endpoint.",
      "ADMIN_DELETION_FORBIDDEN"
    );
  }

  const admin = createAdminSupabaseClient();

  const [activeListingsRes, sellerMatchesRes, dealerMatchesRes, openDisputesRes] =
    await Promise.all([
      admin
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", ctx.userId)
        .in("status", ["ACTIVE", "ACCEPTED"]),
      admin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", ctx.userId)
        .eq("outcome", "APPOINTMENT_CONFIRMED"),
      ctx.dealershipId
        ? admin
            .from("matches")
            .select("id", { count: "exact", head: true })
            .eq("dealership_id", ctx.dealershipId)
            .eq("outcome", "APPOINTMENT_CONFIRMED")
        : Promise.resolve({ count: 0, error: null }),
      admin
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .eq("raised_by_user_id", ctx.userId)
        .in("status", ["INVESTIGATING", "ACTION_REQUIRED"]),
    ]);

  if (
    activeListingsRes.error ||
    sellerMatchesRes.error ||
    dealerMatchesRes.error ||
    openDisputesRes.error
  ) {
    throw new ExternalServiceError(
      "Unable to verify active legal obligations before scheduling deletion.",
      "EXTERNAL_SERVICE_ERROR"
    );
  }

  const hasObligations =
    (activeListingsRes.count ?? 0) > 0 ||
    (sellerMatchesRes.count ?? 0) > 0 ||
    (dealerMatchesRes.count ?? 0) > 0 ||
    (openDisputesRes.count ?? 0) > 0;

  if (hasObligations) {
    throw new ConflictError(
      "You cannot schedule account deletion while an active auction, confirmed handover appointment, or open dispute is in progress.",
      "ACTIVE_OBLIGATION_EXISTS"
    );
  }

  const requestedAt = new Date();
  const scheduledPurgeAt = new Date(
    requestedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  );
  const requestedAtIso = requestedAt.toISOString();
  const scheduledPurgeIso = scheduledPurgeAt.toISOString();

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      account_status: "PENDING_DELETION",
      deletion_requested_at: requestedAtIso,
      marketing_opt_in: false,
      job_title: null,
      avatar_url: null,
      notification_preferences: {
        auctionClosing: false,
        outbidAlert: false,
        escrowDisbursement: false,
        complianceReview: false,
        emailEnabled: false,
        smsEnabled: false,
      } as unknown as Json,
    })
    .eq("id", ctx.userId);

  if (profileErr) {
    throw new ExternalServiceError(
      "Unable to record account deletion schedule right now.",
      "EXTERNAL_SERVICE_ERROR",
      profileErr
    );
  }

  await admin
    .from("listings")
    .update({ status: "CANCELLED" })
    .eq("seller_id", ctx.userId)
    .in("status", ["DRAFT", "PENDING_MODERATION", "EDITS_REQUESTED"]);

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await Promise.all([
    admin.from("user_consents").insert({
      user_id: ctx.userId,
      consent_type: "CASL_MARKETING",
      granted: false,
      policy_version: "1.0",
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
    }),
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "ACCOUNT_DELETION_REQUESTED",
      entity_type: "PROFILE",
      entity_id: ctx.userId,
      provincial_jurisdiction: ctx.profile.province ?? "ON",
      ip_address: meta.ipAddress,
      details:
        "Scheduled 30-day PIPEDA / Quebec Law 25 account erasure; statutory 7-year anonymized audit trail retained per NFR-11",
      before_json: {
        accountStatus: ctx.profile.account_status,
      },
      after_json: {
        accountStatus: "PENDING_DELETION",
        deletionRequestedAt: requestedAtIso,
        scheduledPurgeAt: scheduledPurgeIso,
        gracePeriodDays: GRACE_PERIOD_DAYS,
        ...(input.reason ? { reason: input.reason } : {}),
      } as unknown as Json,
    }),
  ]);

  try {
    await ctx.supabase.auth.signOut({ scope: "global" });
  } catch (signOutErr) {
    logger.warn("Best-effort global signOut failed after deletion request", {
      actorId: ctx.userId,
      meta: { signOutErr },
    });
  }

  return {
    accountStatus: "PENDING_DELETION",
    deletionRequestedAt: requestedAtIso,
    scheduledPurgeAt: scheduledPurgeIso,
    gracePeriodDays: GRACE_PERIOD_DAYS,
    auditRetentionNotice:
      "Statutory Canadian automotive financial and compliance audit trails are retained in anonymized form for 7 years (NFR-11 / OMVIC / AMVIC).",
    message:
      "Your account is scheduled for permanent deletion in 30 days and all active sessions have been signed out.",
    serverTime: new Date().toISOString(),
  };
}
