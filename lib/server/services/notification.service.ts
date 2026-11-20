import { z } from "zod";
import {
  dispatchNotification,
  dispatchNotificationBatch,
  verifyUnsubscribeToken,
  type DispatchNotificationInput,
} from "@/lib/server/adapters/notification.adapter";
import type { SessionContext } from "@/lib/server/auth";
import {
  BadRequestError,
  ExternalServiceError,
  NotFoundError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  CaslUnsubscribeResult,
  ClearNotificationsResponse,
  MarkNotificationsReadResponse,
  NotificationItem,
  NotificationType,
  NotificationsListResponse,
} from "@/lib/types/notifications";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

const NOTIFICATION_TYPES = [
  "BID",
  "KYC",
  "MODERATION",
  "AUCTION",
  "MATCH",
  "BILLING",
  "DISPUTE",
  "SYSTEM",
] as const;

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z.preprocess(
    (val) => val === true || val === "true",
    z.boolean().default(false)
  ),
  type: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z.enum(NOTIFICATION_TYPES).optional()
  ),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type ListNotificationsQuery = z.output<
  typeof listNotificationsQuerySchema
>;

export const markNotificationsReadSchema = z
  .object({
    markAll: z.boolean().optional(),
    notificationIds: z.array(z.string().uuid()).max(200).optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.markAll ||
          (data.notificationIds && data.notificationIds.length > 0)
      ),
    "Specify markAll: true or provide notificationIds."
  );

export type MarkNotificationsReadInput = z.output<
  typeof markNotificationsReadSchema
>;

function extractMetadataRecord(raw: Json): Record<string, unknown> {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function mapNotificationRow(row: NotificationRow): NotificationItem {
  const metadata = extractMetadataRecord(row.metadata);
  const rawActionUrl = metadata.actionUrl;
  const actionUrl =
    typeof rawActionUrl === "string" && rawActionUrl.startsWith("/")
      ? rawActionUrl
      : null;

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    description: row.description,
    listingId: row.listing_id,
    actionUrl,
    metadata,
    read: row.read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function maskEmailAddress(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 1) return "***";
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

async function resolveDealershipUserIds(
  admin: AdminClient,
  dealershipIds: readonly string[],
  excludeUserIds: readonly string[] = []
): Promise<string[]> {
  if (dealershipIds.length === 0) return [];
  const excluded = new Set(excludeUserIds);

  const [membersRes, profilesRes] = await Promise.all([
    admin
      .from("dealership_members")
      .select("user_id")
      .in("dealership_id", [...dealershipIds])
      .eq("is_active", true),
    admin
      .from("profiles")
      .select("id")
      .in("dealership_id", [...dealershipIds])
      .in("role", ["DEALER_ADMIN", "DEALER_AGENT"])
      .eq("account_status", "ACTIVE"),
  ]);

  const ids = new Set<string>();
  for (const row of membersRes.data ?? []) {
    if (!excluded.has(row.user_id)) ids.add(row.user_id);
  }
  for (const row of profilesRes.data ?? []) {
    if (!excluded.has(row.id)) ids.add(row.id);
  }
  return Array.from(ids);
}

/**
 * Lists persistent notifications for the authenticated user via Postgres RLS.
 */
export async function listUserNotifications(
  ctx: SessionContext,
  query: ListNotificationsQuery
): Promise<NotificationsListResponse> {
  let listQuery = ctx.supabase
    .from("notifications")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(query.limit);

  if (query.unreadOnly) {
    listQuery = listQuery.eq("read", false);
  }
  if (query.type) {
    listQuery = listQuery.eq("type", query.type);
  }

  const [listRes, unreadCountRes, totalCountRes] = await Promise.all([
    listQuery,
    ctx.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId)
      .eq("read", false),
    ctx.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId),
  ]);

  if (listRes.error) {
    throw new ExternalServiceError(
      "Unable to load notifications.",
      "EXTERNAL_SERVICE_ERROR",
      listRes.error
    );
  }

  return {
    items: (listRes.data ?? []).map(mapNotificationRow),
    unreadCount: unreadCountRes.count ?? 0,
    totalCount: totalCountRes.count ?? 0,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Marks selected notifications or all unread notifications as read via RLS.
 */
export async function markNotificationsRead(
  ctx: SessionContext,
  input: MarkNotificationsReadInput
): Promise<MarkNotificationsReadResponse> {
  const nowIso = new Date().toISOString();

  let updateQuery = ctx.supabase
    .from("notifications")
    .update({ read: true, read_at: nowIso })
    .eq("user_id", ctx.userId)
    .eq("read", false);

  if (!input.markAll && input.notificationIds) {
    updateQuery = updateQuery.in("id", input.notificationIds);
  }

  const { data: updatedRows, error: updateErr } = await updateQuery.select("id");
  if (updateErr) {
    throw new ExternalServiceError(
      "Unable to update notification read status.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  const { count: remainingUnread } = await ctx.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .eq("read", false);

  return {
    updatedCount: updatedRows?.length ?? 0,
    unreadCount: remainingUnread ?? 0,
    serverTime: nowIso,
  };
}

/**
 * Deletes all notifications belonging to the authenticated user via RLS.
 */
export async function clearUserNotifications(
  ctx: SessionContext
): Promise<ClearNotificationsResponse> {
  const { data: deletedRows, error } = await ctx.supabase
    .from("notifications")
    .delete()
    .eq("user_id", ctx.userId)
    .select("id");

  if (error) {
    throw new ExternalServiceError(
      "Unable to clear notifications.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  return {
    deletedCount: deletedRows?.length ?? 0,
    unreadCount: 0,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Processes a signed CASL 1-click unsubscribe token, updating `profiles`,
 * recording `user_consents(CASL_MARKETING, granted=false)`, and logging to `audit_logs`.
 */
export async function processCaslUnsubscribe(
  token: string,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
): Promise<CaslUnsubscribeResult> {
  if (!token || token.trim().length === 0) {
    throw new BadRequestError(
      "Missing CASL unsubscribe token.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  const claims = verifyUnsubscribeToken(token);
  const admin = createAdminSupabaseClient();

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email, role, province, notification_preferences")
    .eq("id", claims.uid)
    .maybeSingle();

  if (profileErr || !profile) {
    throw new NotFoundError("Account associated with unsubscribe link not found.");
  }

  const currentPrefs = extractMetadataRecord(profile.notification_preferences);
  const nextPrefs: Record<string, Json> = {
    auctionClosing:
      typeof currentPrefs.auctionClosing === "boolean"
        ? currentPrefs.auctionClosing
        : true,
    outbidAlert:
      typeof currentPrefs.outbidAlert === "boolean"
        ? currentPrefs.outbidAlert
        : true,
    escrowDisbursement:
      typeof currentPrefs.escrowDisbursement === "boolean"
        ? currentPrefs.escrowDisbursement
        : true,
    complianceReview:
      typeof currentPrefs.complianceReview === "boolean"
        ? currentPrefs.complianceReview
        : true,
    emailEnabled:
      claims.ch === "email" || claims.ch === "all"
        ? false
        : typeof currentPrefs.emailEnabled === "boolean"
          ? currentPrefs.emailEnabled
          : true,
    smsEnabled:
      claims.ch === "sms" || claims.ch === "all"
        ? false
        : typeof currentPrefs.smsEnabled === "boolean"
          ? currentPrefs.smsEnabled
          : true,
  };

  const nowIso = new Date().toISOString();

  const [profileUpdateRes, consentRes, auditRes] = await Promise.all([
    admin
      .from("profiles")
      .update({
        marketing_opt_in: false,
        notification_preferences: nextPrefs,
      })
      .eq("id", profile.id),
    admin.from("user_consents").insert({
      user_id: profile.id,
      consent_type: "CASL_MARKETING",
      granted: false,
      policy_version: "1.0",
      ip_address: requestMeta.ipAddress,
      user_agent: requestMeta.userAgent,
      recorded_at: nowIso,
    }),
    admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_name: profile.email,
      actor_role: profile.role,
      action: "CASL_UNSUBSCRIBED",
      entity_type: "profile",
      entity_id: profile.id,
      ip_address: requestMeta.ipAddress,
      provincial_jurisdiction: profile.province,
      after_json: {
        channel: claims.ch,
        marketingOptIn: false,
        emailEnabled: nextPrefs.emailEnabled,
        smsEnabled: nextPrefs.smsEnabled,
      },
      details: `Processed CASL one-click unsubscribe (${claims.ch})`,
    }),
  ]);

  if (profileUpdateRes.error) {
    throw new ExternalServiceError(
      "Unable to save unsubscribe preference.",
      "EXTERNAL_SERVICE_ERROR",
      profileUpdateRes.error
    );
  }

  if (consentRes.error) {
    logger.warn("Failed to insert user_consents CASL opt-out record", {
      actorId: profile.id,
      meta: { err: consentRes.error },
    });
  }
  if (auditRes.error) {
    logger.warn("Failed to insert CASL_UNSUBSCRIBED audit record", {
      actorId: profile.id,
      meta: { err: auditRes.error },
    });
  }

  return {
    unsubscribed: true,
    channel: claims.ch,
    emailMasked: maskEmailAddress(profile.email),
    recordedAt: nowIso,
  };
}

/**
 * Sends seller moderation outcome AND on APPROVE executes PostGIS radius fan-out
 * (`FR-DL-05 / AC-06`) to notify all verified subscribed dealerships within radius.
 */
export async function notifyListingModerationDecision(params: {
  listingId: string;
  sellerId: string;
  vin: string;
  vehicleLabel: string;
  status: string;
  action: "APPROVE" | "REQUEST_EDITS" | "REJECT";
  reason?: string | null;
  auctionEndsAt?: string | null;
}): Promise<{ eligibleDealerUsersNotified: number }> {
  const sellerActionUrl = `/seller/listings/${params.listingId}`;

  if (params.action === "APPROVE") {
    await dispatchNotification({
      userId: params.sellerId,
      type: "AUCTION",
      templateKey: "LISTING_APPROVED_SELLER",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        actionUrl: sellerActionUrl,
      },
      metadata: {
        vin: params.vin,
        status: params.status,
        auctionEndsAt: params.auctionEndsAt ?? null,
      },
      channels: ["IN_APP", "EMAIL", "SMS"],
      preferenceCategory: "complianceReview",
    });

    const admin = createAdminSupabaseClient();
    const { data: eligibleRows, error: rpcErr } = await admin.rpc(
      "get_eligible_dealerships_within_radius",
      { p_listing_id: params.listingId }
    );

    if (rpcErr) {
      logger.warn("PostGIS radius dealer fan-out query failed", {
        meta: { listingId: params.listingId, rpcErr },
      });
      return { eligibleDealerUsersNotified: 0 };
    }

    const recipients = (eligibleRows ?? []).filter(
      (r) => r.user_id !== params.sellerId
    );
    if (recipients.length === 0) {
      return { eligibleDealerUsersNotified: 0 };
    }

    const dealerInputs: DispatchNotificationInput[] = recipients.map((row) => ({
      userId: row.user_id,
      type: "AUCTION",
      templateKey: "LISTING_APPROVED_DEALER_RADIUS",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        distanceKm: row.distance_km,
        actionUrl: `/dealer/auctions/${params.listingId}`,
      },
      metadata: {
        dealershipId: row.dealership_id,
        dealershipName: row.operating_name,
        distanceKm: row.distance_km,
        effectiveRadiusKm: row.effective_radius_km,
        auctionEndsAt: params.auctionEndsAt ?? null,
      },
      channels: ["IN_APP", "EMAIL"],
    }));

    await dispatchNotificationBatch(dealerInputs);
    return { eligibleDealerUsersNotified: dealerInputs.length };
  }

  await dispatchNotification({
    userId: params.sellerId,
    type: "MODERATION",
    templateKey:
      params.action === "REQUEST_EDITS"
        ? "LISTING_EDITS_REQUESTED"
        : "LISTING_REJECTED",
    listingId: params.listingId,
    vars: {
      vehicleLabel: params.vehicleLabel,
      reason: params.reason?.trim() || undefined,
      actionUrl: sellerActionUrl,
    },
    metadata: {
      vin: params.vin,
      status: params.status,
    },
    channels: ["IN_APP", "EMAIL"],
    preferenceCategory: "complianceReview",
  });

  return { eligibleDealerUsersNotified: 0 };
}

/**
 * Dispatches multi-channel unsealing notices to seller and participating bidding
 * dealerships when an auction closes/force-closes (zero bid amounts revealed).
 */
export async function notifyAuctionClosed(params: {
  listingId: string;
  sellerId: string;
  vehicleLabel: string;
  bidCount: number;
  status: string;
  source?: "FORCE_CLOSE" | "SYSTEM_CLOSE";
}): Promise<void> {
  const admin = createAdminSupabaseClient();

  await dispatchNotification({
    userId: params.sellerId,
    type: "AUCTION",
    templateKey: "AUCTION_CLOSED_SELLER",
    listingId: params.listingId,
    vars: {
      vehicleLabel: params.vehicleLabel,
      bidCount: params.bidCount,
      actionUrl: `/seller/listings/${params.listingId}`,
    },
    metadata: {
      action: params.source ?? "FORCE_CLOSE",
      status: params.status,
      bidCount: params.bidCount,
    },
    channels: ["IN_APP", "EMAIL", "SMS"],
    preferenceCategory: "auctionClosing",
  });

  const { data: bidDealers } = await admin
    .from("bids")
    .select("dealership_id")
    .eq("listing_id", params.listingId)
    .neq("status", "VOIDED");

  const dealershipIds = Array.from(
    new Set((bidDealers ?? []).map((b) => b.dealership_id))
  );
  const dealerUserIds = await resolveDealershipUserIds(admin, dealershipIds, [
    params.sellerId,
  ]);

  if (dealerUserIds.length === 0) return;

  await dispatchNotificationBatch(
    dealerUserIds.map((userId) => ({
      userId,
      type: "AUCTION",
      templateKey: "AUCTION_CLOSED_DEALER",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        actionUrl: "/dealer/active-bids",
      },
      metadata: {
        action: params.source ?? "FORCE_CLOSE",
        status: params.status,
      },
      channels: ["IN_APP", "EMAIL"],
      preferenceCategory: "auctionClosing",
    }))
  );
}

/**
 * Dispatches auction extension notifications to seller and participating dealers.
 */
export async function notifyAuctionExtended(params: {
  listingId: string;
  sellerId: string;
  vehicleLabel: string;
  hours: number;
  reason: string;
  auctionEndsAt: string | null;
}): Promise<void> {
  const admin = createAdminSupabaseClient();

  await dispatchNotification({
    userId: params.sellerId,
    type: "AUCTION",
    templateKey: "AUCTION_EXTENDED_SELLER",
    listingId: params.listingId,
    vars: {
      vehicleLabel: params.vehicleLabel,
      hours: params.hours,
      reason: params.reason,
      actionUrl: `/seller/listings/${params.listingId}`,
    },
    metadata: {
      action: "EXTEND",
      extensionHours: params.hours,
      auctionEndsAt: params.auctionEndsAt,
    },
    channels: ["IN_APP", "EMAIL"],
    preferenceCategory: "auctionClosing",
  });

  const { data: bidDealers } = await admin
    .from("bids")
    .select("dealership_id")
    .eq("listing_id", params.listingId)
    .neq("status", "VOIDED");

  const dealershipIds = Array.from(
    new Set((bidDealers ?? []).map((b) => b.dealership_id))
  );
  const dealerUserIds = await resolveDealershipUserIds(admin, dealershipIds, [
    params.sellerId,
  ]);

  if (dealerUserIds.length === 0) return;

  await dispatchNotificationBatch(
    dealerUserIds.map((userId) => ({
      userId,
      type: "AUCTION",
      templateKey: "AUCTION_EXTENDED_DEALER",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        hours: params.hours,
        reason: params.reason,
        actionUrl: `/dealer/auctions/${params.listingId}`,
      },
      metadata: {
        action: "EXTEND",
        extensionHours: params.hours,
        auctionEndsAt: params.auctionEndsAt,
      },
      channels: ["IN_APP", "EMAIL"],
      preferenceCategory: "auctionClosing",
    }))
  );
}

/**
 * Dispatches regulatory halt notices to seller and dealerships with voided bids.
 */
export async function notifyAuctionHalted(params: {
  listingId: string;
  sellerId: string;
  vehicleLabel: string;
  reason: string;
  voidedBidsCount: number;
  voidedDealershipIds: readonly string[];
}): Promise<void> {
  const admin = createAdminSupabaseClient();

  await dispatchNotification({
    userId: params.sellerId,
    type: "AUCTION",
    templateKey: "AUCTION_HALTED_SELLER",
    listingId: params.listingId,
    vars: {
      vehicleLabel: params.vehicleLabel,
      reason: params.reason,
      actionUrl: `/seller/listings/${params.listingId}`,
    },
    metadata: {
      action: "HALT",
      status: "CANCELLED",
      voidedBidsCount: params.voidedBidsCount,
    },
    channels: ["IN_APP", "EMAIL"],
    preferenceCategory: "complianceReview",
  });

  const dealerUserIds = await resolveDealershipUserIds(
    admin,
    params.voidedDealershipIds,
    [params.sellerId]
  );

  if (dealerUserIds.length === 0) return;

  await dispatchNotificationBatch(
    dealerUserIds.map((userId) => ({
      userId,
      type: "AUCTION",
      templateKey: "AUCTION_HALTED_DEALER",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        reason: params.reason,
        actionUrl: "/dealer/active-bids",
      },
      metadata: {
        action: "HALT",
        status: "CANCELLED",
      },
      channels: ["IN_APP", "EMAIL"],
      preferenceCategory: "complianceReview",
    }))
  );
}

/**
 * Dispatches match notifications upon seller acceptance:
 * 1) Seller voucher pass ready (IN_APP + EMAIL + SMS)
 * 2) Winning dealership staff handover pass (IN_APP + EMAIL + SMS)
 * 3) Non-selected bidding dealership staff lot-closed notice (zero winning dollar/dealer leaked)
 */
export async function notifyMatchCreated(params: {
  matchId: string;
  listingId: string;
  sellerId: string;
  winningDealershipId: string;
  dealershipName: string;
  vehicleLabel: string;
  voucherCode: string;
  agreedAmountCents: number;
  expiresAt: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();

  const [{ data: allBids }, winningUserIds] = await Promise.all([
    admin
      .from("bids")
      .select("dealership_id")
      .eq("listing_id", params.listingId)
      .neq("status", "VOIDED"),
    resolveDealershipUserIds(admin, [params.winningDealershipId], [
      params.sellerId,
    ]),
  ]);

  const nonSelectedDealerIds = Array.from(
    new Set(
      (allBids ?? [])
        .map((b) => b.dealership_id)
        .filter((id) => id !== params.winningDealershipId)
    )
  );
  const nonSelectedUserIds = await resolveDealershipUserIds(
    admin,
    nonSelectedDealerIds,
    [params.sellerId, ...winningUserIds]
  );

  const dispatches: DispatchNotificationInput[] = [
    {
      userId: params.sellerId,
      type: "MATCH",
      templateKey: "MATCH_CREATED_SELLER",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        dealershipName: params.dealershipName,
        voucherCode: params.voucherCode,
        actionUrl: `/seller/listings/${params.listingId}`,
      },
      metadata: {
        matchId: params.matchId,
        voucherCode: params.voucherCode,
        dealershipId: params.winningDealershipId,
        agreedAmountCents: params.agreedAmountCents,
        expiresAt: params.expiresAt,
      },
      channels: ["IN_APP", "EMAIL", "SMS"],
    },
    ...winningUserIds.map(
      (userId): DispatchNotificationInput => ({
        userId,
        type: "MATCH",
        templateKey: "MATCH_CREATED_WINNING_DEALER",
        listingId: params.listingId,
        vars: {
          vehicleLabel: params.vehicleLabel,
          voucherCode: params.voucherCode,
          agreedAmountCents: params.agreedAmountCents,
          actionUrl: "/dealer/won-matches",
        },
        metadata: {
          matchId: params.matchId,
          voucherCode: params.voucherCode,
          dealershipId: params.winningDealershipId,
          agreedAmountCents: params.agreedAmountCents,
          expiresAt: params.expiresAt,
        },
        channels: ["IN_APP", "EMAIL", "SMS"],
      })
    ),
    ...nonSelectedUserIds.map(
      (userId): DispatchNotificationInput => ({
        userId,
        type: "MATCH",
        templateKey: "MATCH_NOT_SELECTED_DEALER",
        listingId: params.listingId,
        vars: {
          vehicleLabel: params.vehicleLabel,
          actionUrl: "/dealer/inventory",
        },
        metadata: {
          event: "MATCH_NOT_SELECTED",
          listingId: params.listingId,
        },
        channels: ["IN_APP", "EMAIL"],
      })
    ),
  ];

  await dispatchNotificationBatch(dispatches);
}

/**
 * Dispatches multi-channel notifications when an accepted 24h handover window expires.
 */
export async function notifyMatchAcceptanceExpired(params: {
  matchId: string;
  listingId: string;
  sellerId: string;
  dealershipId: string;
  vehicleLabel: string;
  voucherCode: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  const dealerUserIds = await resolveDealershipUserIds(
    admin,
    [params.dealershipId],
    [params.sellerId]
  );

  const dispatches: DispatchNotificationInput[] = [
    {
      userId: params.sellerId,
      type: "MATCH",
      templateKey: "MATCH_ACCEPTANCE_EXPIRED_SELLER",
      listingId: params.listingId,
      vars: {
        vehicleLabel: params.vehicleLabel,
        voucherCode: params.voucherCode,
        actionUrl: `/seller/listings/${params.listingId}`,
      },
      metadata: {
        matchId: params.matchId,
        voucherCode: params.voucherCode,
      },
      channels: ["IN_APP", "EMAIL"],
    },
    ...dealerUserIds.map(
      (userId): DispatchNotificationInput => ({
        userId,
        type: "MATCH",
        templateKey: "MATCH_ACCEPTANCE_EXPIRED_DEALER",
        listingId: params.listingId,
        vars: {
          vehicleLabel: params.vehicleLabel,
          voucherCode: params.voucherCode,
          actionUrl: "/dealer/won-matches",
        },
        metadata: {
          matchId: params.matchId,
          voucherCode: params.voucherCode,
        },
        channels: ["IN_APP", "EMAIL"],
      })
    ),
  ];

  await dispatchNotificationBatch(dispatches);
}
