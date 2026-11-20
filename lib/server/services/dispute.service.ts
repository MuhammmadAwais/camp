import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { getStorageAdapter } from "@/lib/server/adapters/storage.adapter";
import type { SessionContext } from "@/lib/server/auth";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AdminDealerRegulator,
  AdminDisputesResponse,
  DisputeCategory,
  DisputeEvidencePresignResponse,
  DisputeItem,
  DisputePhoto,
  DisputeQueueCounts,
  DisputeResolutionDecision,
  DisputeTimelineEntry,
  ResolveDisputeResult,
} from "@/lib/types/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";
const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024; // 20 MB per file

const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  UNDERBODY_DAMAGE: "Undisclosed Hoist Corrosion",
  MISSING_KEYS: "Missing Smart Key Fob",
  MECHANICAL_POWERTRAIN: "Powertrain & Drivetrain Defect",
  ODOMETER_DISCREPANCY: "Odometer Discrepancy",
  UNRESOLVED_LIEN: "Unresolved Lien / Payout Variance",
};

const ACTION_CATEGORY_MAP: Record<DisputeCategory, DisputeCategory> = {
  UNDERBODY_DAMAGE: "UNDERBODY_DAMAGE",
  MISSING_KEYS: "MISSING_KEYS",
  MECHANICAL_POWERTRAIN: "MECHANICAL_POWERTRAIN",
  ODOMETER_DISCREPANCY: "ODOMETER_DISCREPANCY",
  UNRESOLVED_LIEN: "UNRESOLVED_LIEN",
};

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type DisputeRow = Database["public"]["Tables"]["disputes"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DealershipRow = Database["public"]["Tables"]["dealerships"]["Row"];
type MediaRow = Database["public"]["Tables"]["listing_media"]["Row"];
type TimelineRow = Database["public"]["Tables"]["dispute_timeline"]["Row"];

export const disputeEvidencePhotoInputSchema = z
  .object({
    url: z.string().trim().max(2000).optional(),
    storagePath: z.string().trim().max(500).optional(),
    label: z.string().trim().min(1).max(200).default("Hoist Evidence Photo"),
    isHoistEvidence: z.boolean().optional().default(true),
  })
  .refine(
    (item) => Boolean(item.url || item.storagePath),
    "Each evidence photo must specify a url or storagePath."
  );

export const presignDisputeEvidenceSchema = z.object({
  matchId: z.string().uuid("Invalid match identifier."),
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required.")
    .max(180, "File name is too long."),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
  ]),
  fileSizeBytes: z
    .number()
    .int()
    .min(1, "File cannot be empty.")
    .max(MAX_EVIDENCE_BYTES, "Evidence file exceeds the 20 MB limit."),
});

export type PresignDisputeEvidenceInput = z.output<
  typeof presignDisputeEvidenceSchema
>;

export const openDisputeSchema = z.object({
  matchId: z.string().uuid("Invalid match identifier."),
  category: z.enum([
    "UNDERBODY_DAMAGE",
    "MISSING_KEYS",
    "MECHANICAL_POWERTRAIN",
    "ODOMETER_DISCREPANCY",
    "UNRESOLVED_LIEN",
  ]),
  disputedAdjustmentCents: z
    .number()
    .int("Adjustment must be integer CAD cents.")
    .min(0, "Disputed adjustment cannot be negative.")
    .max(100_000_000, "Disputed adjustment exceeds maximum limit."),
  allegationSummary: z
    .string()
    .trim()
    .min(10, "Provide a clear discrepancy summary (at least 10 characters).")
    .max(2000, "Summary cannot exceed 2,000 characters."),
  hoistEvidenceNotes: z.string().trim().max(2000).optional(),
  technicianName: z.string().trim().max(120).optional(),
  evidencePhotos: z
    .array(disputeEvidencePhotoInputSchema)
    .max(12, "Maximum 12 evidence files per dispute.")
    .optional()
    .default([]),
});

export type OpenDisputeInput = z.output<typeof openDisputeSchema>;

const emptyToUndefined = (val: unknown): unknown =>
  val === "" || val === null || val === undefined ? undefined : val;

export const adminDisputesQuerySchema = z.object({
  status: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : String(val).trim().toUpperCase(),
    z
      .enum(["ALL", "INVESTIGATING", "ACTION_REQUIRED", "RESOLVED", "CLOSED"])
      .optional()
  ),
  category: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : String(val).trim().toUpperCase(),
    z
      .enum([
        "ALL",
        "UNDERBODY_DAMAGE",
        "MISSING_KEYS",
        "MECHANICAL_POWERTRAIN",
        "ODOMETER_DISCREPANCY",
        "UNRESOLVED_LIEN",
      ])
      .optional()
  ),
  search: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
});

export type AdminDisputesQuery = z.output<typeof adminDisputesQuerySchema>;

export const resolveDisputeSchema = z.object({
  decision: z.enum(["APPROVE_ADJUSTMENT", "REJECT_CLAIM", "MUTUAL_CANCEL"]),
  adjustmentCents: z
    .number()
    .int("Adjustment amount must be integer CAD cents.")
    .min(0, "Adjustment amount cannot be negative.")
    .max(100_000_000, "Adjustment amount exceeds permitted limit.")
    .optional(),
  notes: z
    .string()
    .trim()
    .min(5, "Binding mediation notes must be at least 5 characters.")
    .max(2000, "Notes cannot exceed 2,000 characters."),
});

export type ResolveDisputeInput = z.output<typeof resolveDisputeSchema>;

function assertAdmin(ctx: SessionContext): void {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can access dispute arbitration dossiers."
    );
  }
}

function assertMatchParticipantOrAdmin(
  ctx: SessionContext,
  match: MatchRow
): void {
  if (ctx.role === "ADMIN") return;
  const isSeller = match.seller_id === ctx.userId;
  const isDealer =
    Boolean(ctx.dealershipId) && match.dealership_id === ctx.dealershipId;

  if (!isSeller && !isDealer) {
    throw new ForbiddenError(
      "You do not have permission to upload evidence or open a dispute for this match."
    );
  }
}

function sanitizeFileName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return cleaned || "evidence-photo.png";
}

function formatOpenedRelative(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Recently";
  const diffMins = Math.floor((Date.now() - parsed) / 60_000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function formatTimelineStamp(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Just now";
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function parseEvidenceJson(
  raw: DisputeRow["evidence_photos_json"]
): Array<{
  url: string | null;
  storagePath: string | null;
  label: string;
  isHoistEvidence: boolean;
}> {
  if (!Array.isArray(raw)) return [];
  const parsed: Array<{
    url: string | null;
    storagePath: string | null;
    label: string;
    isHoistEvidence: boolean;
  }> = [];

  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" && rec.url.trim() ? rec.url.trim() : null;
    const storagePath =
      typeof rec.storagePath === "string" && rec.storagePath.trim()
        ? rec.storagePath.trim()
        : null;
    if (!url && !storagePath) continue;
    const label =
      typeof rec.label === "string" && rec.label.trim()
        ? rec.label.trim()
        : "Technician Hoist Evidence";
    const isHoistEvidence =
      typeof rec.isHoistEvidence === "boolean" ? rec.isHoistEvidence : true;
    parsed.push({ url, storagePath, label, isHoistEvidence });
  }

  return parsed;
}

async function resolveDisputePhotos(
  evidenceJson: DisputeRow["evidence_photos_json"],
  listingMedia: ReadonlyArray<MediaRow>
): Promise<DisputePhoto[]> {
  const storage = getStorageAdapter();
  const hoistEntries = parseEvidenceJson(evidenceJson);

  const resolvedHoist = await Promise.all(
    hoistEntries.map(async (entry): Promise<DisputePhoto | null> => {
      let signedOrPublicUrl = entry.url;
      if (entry.storagePath) {
        try {
          signedOrPublicUrl = await storage.createSignedReadUrl(
            "dispute-evidence",
            entry.storagePath,
            1800
          );
        } catch (err) {
          logger.warn("Dispute evidence signed URL fallback", {
            meta: {
              storagePath: entry.storagePath,
              error: err instanceof Error ? err.message : String(err),
            },
          });
        }
      }
      if (!signedOrPublicUrl) return null;
      return {
        url: signedOrPublicUrl,
        label: entry.label,
        isHoistEvidence: entry.isHoistEvidence,
        storagePath: entry.storagePath,
      };
    })
  );

  const orderedMedia = [...listingMedia].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return a.sort_order - b.sort_order;
  });

  const sellerPhotos: DisputePhoto[] = orderedMedia
    .filter((m) => m.public_url.trim().length > 0)
    .map((m, idx) => ({
      url: m.public_url,
      label: m.photo_label?.trim() || `Seller Listing Photo #${idx + 1}`,
      isHoistEvidence: false,
      storagePath: null,
    }));

  const combined = [
    ...resolvedHoist.filter((p): p is DisputePhoto => p !== null),
    ...sellerPhotos,
  ];

  if (combined.length === 0) {
    combined.push({
      url: DEFAULT_THUMBNAIL,
      label: "Vehicle Reference Photo",
      isHoistEvidence: false,
      storagePath: null,
    });
  }

  return combined;
}

function normalizeResolutionDecision(
  raw: string | null
): DisputeResolutionDecision | null {
  if (
    raw === "APPROVE_ADJUSTMENT" ||
    raw === "REJECT_CLAIM" ||
    raw === "MUTUAL_CANCEL"
  ) {
    return raw;
  }
  return null;
}

function computeQueueCounts(
  rows: ReadonlyArray<DisputeRow>
): DisputeQueueCounts {
  return {
    ALL: rows.length,
    INVESTIGATING: rows.filter((d) => d.status === "INVESTIGATING").length,
    ACTION_REQUIRED: rows.filter((d) => d.status === "ACTION_REQUIRED").length,
    RESOLVED: rows.filter((d) => d.status === "RESOLVED").length,
    CLOSED: rows.filter((d) => d.status === "CLOSED").length,
  };
}

async function hydrateDisputes(
  admin: AdminClient,
  rows: DisputeRow[]
): Promise<DisputeItem[]> {
  if (rows.length === 0) return [];

  const disputeIds = rows.map((r) => r.id);
  const matchIds = Array.from(new Set(rows.map((r) => r.match_id)));
  const listingIds = Array.from(new Set(rows.map((r) => r.listing_id)));

  const [matchesRes, listingsRes, mediaRes, timelineRes] = await Promise.all([
    admin.from("matches").select("*").in("id", matchIds),
    admin.from("listings").select("*").in("id", listingIds),
    admin.from("listing_media").select("*").in("listing_id", listingIds),
    admin
      .from("dispute_timeline")
      .select("*")
      .in("dispute_id", disputeIds)
      .order("created_at", { ascending: true }),
  ]);

  const matchMap = new Map<string, MatchRow>(
    (matchesRes.data ?? []).map((m) => [m.id, m])
  );
  const listingMap = new Map<string, ListingRow>(
    (listingsRes.data ?? []).map((l) => [l.id, l])
  );

  const mediaByListing = new Map<string, MediaRow[]>();
  for (const media of mediaRes.data ?? []) {
    const arr = mediaByListing.get(media.listing_id) ?? [];
    arr.push(media);
    mediaByListing.set(media.listing_id, arr);
  }

  const timelineByDispute = new Map<string, TimelineRow[]>();
  for (const entry of timelineRes.data ?? []) {
    const arr = timelineByDispute.get(entry.dispute_id) ?? [];
    arr.push(entry);
    timelineByDispute.set(entry.dispute_id, arr);
  }

  const sellerIds = Array.from(
    new Set(
      (matchesRes.data ?? [])
        .map((m) => m.seller_id)
        .concat(rows.map((r) => r.raised_by_user_id))
    )
  );
  const dealershipIds = Array.from(
    new Set((matchesRes.data ?? []).map((m) => m.dealership_id))
  );

  const [profilesRes, dealershipsRes] = await Promise.all([
    sellerIds.length > 0
      ? admin.from("profiles").select("*").in("id", sellerIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    dealershipIds.length > 0
      ? admin.from("dealerships").select("*").in("id", dealershipIds)
      : Promise.resolve({ data: [] as DealershipRow[] }),
  ]);

  const profileMap = new Map<string, ProfileRow>(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const dealershipMap = new Map<string, DealershipRow>(
    (dealershipsRes.data ?? []).map((d) => [d.id, d])
  );

  return Promise.all(
    rows.map(async (row): Promise<DisputeItem> => {
      const match = matchMap.get(row.match_id);
      const listing = listingMap.get(row.listing_id);
      const seller = match
        ? profileMap.get(match.seller_id)
        : profileMap.get(row.raised_by_user_id);
      const dealership = match
        ? dealershipMap.get(match.dealership_id)
        : undefined;
      const photos = await resolveDisputePhotos(
        row.evidence_photos_json,
        mediaByListing.get(row.listing_id) ?? []
      );
      const sellerPhotosFirst = photos.find((p) => !p.isHoistEvidence);
      const thumbnailUrl =
        sellerPhotosFirst?.url ?? photos[0]?.url ?? DEFAULT_THUMBNAIL;

      const timeline: DisputeTimelineEntry[] = (
        timelineByDispute.get(row.id) ?? []
      ).map((t) => ({
        timestamp: formatTimelineStamp(t.created_at),
        timestampIso: t.created_at,
        actor: t.actor_label,
        action: t.action,
        note: t.note,
      }));

      const category = ACTION_CATEGORY_MAP[row.category];
      const sellerName = seller
        ? `${seller.first_name} ${seller.last_name}`.trim() || seller.email
        : "Private Seller";

      return {
        id: row.id,
        docketNumber: row.docket_number,
        matchId: row.match_id,
        listingId: row.listing_id,
        openedAt: row.created_at,
        openedDateFormatted: formatOpenedRelative(row.created_at),
        status: row.status,
        category,
        categoryLabel: CATEGORY_LABELS[category],
        agreedBidCents: row.agreed_bid_cents,
        disputedAdjustmentCents: row.disputed_adjustment_cents,
        netSettlementCents: row.net_settlement_cents,
        allegationSummary: row.allegation_summary,
        hoistEvidenceNotes:
          row.hoist_evidence_notes ??
          "Submitted with dealership handover inspection report.",
        complianceDecisionNotes: row.compliance_decision_notes,
        resolutionDecision: normalizeResolutionDecision(row.resolution_decision),
        resolvedAt: row.resolved_at,
        seller: {
          id: match?.seller_id ?? row.raised_by_user_id,
          name: sellerName,
          email: seller?.email ?? "seller@autonexa.ca",
          phone: seller?.phone_e164 ?? "Not provided",
          city: listing?.city || seller?.city || "Toronto",
          province: listing?.province || seller?.province || "ON",
          declaredConditionGrade: listing
            ? `Grade ${listing.damage_grade}`
            : "Declared Condition",
        },
        dealership: {
          id: dealership?.id ?? match?.dealership_id ?? "",
          name: dealership?.operating_name ?? "Licensed Dealership",
          legalEntity:
            dealership?.legal_name ?? "Verified Commercial Dealership",
          regulator: (dealership?.regulator ?? "OMVIC") as AdminDealerRegulator,
          licenseNumber: dealership?.license_number ?? "VERIFIED",
          contactOfficer: dealership?.contact_name ?? "Purchasing Officer",
          technician: row.technician_name || "Dealership Service Technician",
          city: dealership?.city ?? "Toronto",
          province: dealership?.province ?? "ON",
        },
        vehicle: {
          vin: listing?.vin ?? "UNAVAILABLE",
          year: listing?.year ?? new Date().getFullYear(),
          make: listing?.make ?? "Vehicle",
          model: listing?.model ?? "Lot",
          trim: listing?.trim ?? "",
          mileageKm: listing?.mileage_km ?? 0,
          ...(listing?.engine_spec ? { engineSpec: listing.engine_spec } : {}),
          transmission: listing?.transmission ?? "Automatic",
          drivetrain: listing?.drivetrain ?? "AWD",
          thumbnailUrl,
          photos,
        },
        timeline,
      };
    })
  );
}

/**
 * Issues a signed Supabase Storage upload URL inside `dispute-evidence` scoped
 * strictly to participants of the referenced match (FR-AD-06).
 */
export async function presignDisputeEvidence(
  ctx: SessionContext,
  input: PresignDisputeEvidenceInput
): Promise<DisputeEvidencePresignResponse> {
  const admin = createAdminSupabaseClient();
  const { data: match, error: matchErr } = await admin
    .from("matches")
    .select("*")
    .eq("id", input.matchId)
    .maybeSingle();

  if (matchErr) {
    throw new ExternalServiceError(
      "Unable to verify match authorization for evidence upload.",
      "EXTERNAL_SERVICE_ERROR",
      matchErr
    );
  }

  if (!match) {
    throw new NotFoundError("Match record not found.");
  }

  assertMatchParticipantOrAdmin(ctx, match);

  const safeName = sanitizeFileName(input.fileName);
  const objectPath = `${ctx.userId}/${match.id}/${randomUUID()}-${safeName}`;
  const storage = getStorageAdapter();
  const signed = await storage.createSignedUploadUrl(
    "dispute-evidence",
    objectPath,
    input.contentType
  );

  return {
    uploadUrl: signed.uploadUrl,
    token: signed.token,
    storagePath: signed.path,
    expiresInSeconds: signed.expiresInSeconds,
  };
}

/**
 * Opens a post-inspection arbitration dispute docket linked to an existing won match (FR-AD-06).
 */
export async function openDispute(
  ctx: SessionContext,
  input: OpenDisputeInput,
  requestMeta: { ipAddress: string | null }
): Promise<DisputeItem> {
  const admin = createAdminSupabaseClient();
  const { data: match, error: matchErr } = await admin
    .from("matches")
    .select("*")
    .eq("id", input.matchId)
    .maybeSingle();

  if (matchErr) {
    throw new ExternalServiceError(
      "Unable to verify match record.",
      "EXTERNAL_SERVICE_ERROR",
      matchErr
    );
  }

  if (!match) {
    throw new NotFoundError("Won match record not found.");
  }

  assertMatchParticipantOrAdmin(ctx, match);

  if (input.disputedAdjustmentCents > match.agreed_amount_cents) {
    throw new ValidationError(
      "Disputed adjustment cannot exceed the agreed winning bid amount.",
      {
        disputedAdjustmentCents:
          "Deduction claim cannot exceed the agreed offer in CAD.",
      }
    );
  }

  const { data: existingOpen } = await admin
    .from("disputes")
    .select("id, docket_number, status")
    .eq("match_id", match.id)
    .in("status", ["INVESTIGATING", "ACTION_REQUIRED"])
    .maybeSingle();

  if (existingOpen) {
    throw new ConflictError(
      `Dispute docket ${existingOpen.docket_number} is already active for this match.`,
      "DISPUTE_ALREADY_OPEN"
    );
  }

  const netSettlementCents =
    match.agreed_amount_cents - input.disputedAdjustmentCents;
  const docketNumber = `DSP-${new Date().getFullYear()}-${randomInt(10000, 99999)}`;
  const normalizedEvidence = (input.evidencePhotos ?? []).map((photo) => ({
    ...(photo.url ? { url: photo.url } : {}),
    ...(photo.storagePath ? { storagePath: photo.storagePath } : {}),
    label: photo.label,
    isHoistEvidence: photo.isHoistEvidence ?? true,
  }));

  const { data: insertedDispute, error: insertErr } = await admin
    .from("disputes")
    .insert({
      docket_number: docketNumber,
      match_id: match.id,
      listing_id: match.listing_id,
      raised_by_user_id: ctx.userId,
      category: input.category,
      status: "INVESTIGATING",
      agreed_bid_cents: match.agreed_amount_cents,
      disputed_adjustment_cents: input.disputedAdjustmentCents,
      net_settlement_cents: netSettlementCents,
      allegation_summary: input.allegationSummary,
      hoist_evidence_notes: input.hoistEvidenceNotes ?? null,
      technician_name: input.technicianName ?? null,
      evidence_photos_json: normalizedEvidence,
    })
    .select("*")
    .single();

  if (insertErr || !insertedDispute) {
    throw new ExternalServiceError(
      "Unable to open post-inspection dispute docket.",
      "EXTERNAL_SERVICE_ERROR",
      insertErr
    );
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("dispute_timeline").insert({
    dispute_id: insertedDispute.id,
    actor_user_id: ctx.userId,
    actor_label: actorName,
    action: "DISPUTE_OPENED",
    note: input.allegationSummary,
  });

  const { data: dealershipMembers } = await admin
    .from("dealership_members")
    .select("user_id")
    .eq("dealership_id", match.dealership_id)
    .eq("is_active", true);

  const notifyRecipients = new Set<string>([match.seller_id]);
  for (const m of dealershipMembers ?? []) {
    notifyRecipients.add(m.user_id);
  }
  notifyRecipients.delete(ctx.userId);

  const recipientIds = Array.from(notifyRecipients);

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "DISPUTE_OPENED",
      entity_type: "dispute",
      entity_id: insertedDispute.id,
      provincial_jurisdiction: ctx.profile.province ?? "ON",
      ip_address: requestMeta.ipAddress,
      details: `Opened arbitration docket ${docketNumber} (${input.category}) for match ${match.voucher_code}`,
      after_json: {
        docketNumber,
        matchId: match.id,
        category: input.category,
        agreedBidCents: match.agreed_amount_cents,
        disputedAdjustmentCents: input.disputedAdjustmentCents,
        netSettlementCents,
      },
    }),
    ...(recipientIds.length > 0
      ? [
          admin.from("notifications").insert(
            recipientIds.map((uid) => ({
              user_id: uid,
              type: "DISPUTE" as const,
              title: `Arbitration docket ${docketNumber} opened`,
              description: input.allegationSummary.slice(0, 180),
              listing_id: match.listing_id,
              metadata: {
                disputeId: insertedDispute.id,
                docketNumber,
                matchId: match.id,
              },
            }))
          ),
        ]
      : []),
  ]);

  const [hydrated] = await hydrateDisputes(admin, [insertedDispute]);
  return hydrated;
}

/**
 * Lists disputes visible to the caller (participant-scoped for sellers/dealers, all for Admins).
 */
export async function listMyDisputes(
  ctx: SessionContext
): Promise<AdminDisputesResponse> {
  const { data: rows, error } = await ctx.supabase
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new ExternalServiceError(
      "Unable to load dispute records.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const allRows = rows ?? [];
  const admin = createAdminSupabaseClient();
  const items = await hydrateDisputes(admin, allRows);

  return {
    items,
    counts: computeQueueCounts(allRows),
    serverTime: new Date().toISOString(),
  };
}

/**
 * Lists all platform dispute dockets for Admin Arbitration (FR-AD-06).
 */
export async function listDisputes(
  ctx: SessionContext,
  filters: AdminDisputesQuery
): Promise<AdminDisputesResponse> {
  assertAdmin(ctx);

  const admin = createAdminSupabaseClient();
  const { data: rows, error } = await admin
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new ExternalServiceError(
      "Unable to load admin dispute arbitration queue.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const allRows = rows ?? [];
  const counts = computeQueueCounts(allRows);

  const preFiltered = allRows.filter((row) => {
    if (filters.status && filters.status !== "ALL") {
      if (row.status !== filters.status) return false;
    }
    if (filters.category && row.category !== filters.category) {
      return false;
    }
    return true;
  });

  let items = await hydrateDisputes(admin, preFiltered);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.docketNumber.toLowerCase().includes(q) ||
        item.vehicle.vin.toLowerCase().includes(q) ||
        item.vehicle.make.toLowerCase().includes(q) ||
        item.vehicle.model.toLowerCase().includes(q) ||
        item.seller.name.toLowerCase().includes(q) ||
        item.dealership.name.toLowerCase().includes(q) ||
        item.allegationSummary.toLowerCase().includes(q)
    );
  }

  return {
    items,
    counts,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Loads the complete Admin Dispute Arbitration Dossier by UUID or Docket Number.
 */
export async function getDisputeDetail(
  ctx: SessionContext,
  idOrDocket: string
): Promise<DisputeItem> {
  assertAdmin(ctx);

  const admin = createAdminSupabaseClient();
  const isUuid = UUID_REGEX.test(idOrDocket);
  const query = admin.from("disputes").select("*");
  const { data: row, error } = isUuid
    ? await query.eq("id", idOrDocket).maybeSingle()
    : await query.eq("docket_number", idOrDocket.toUpperCase()).maybeSingle();

  if (error) {
    throw new ExternalServiceError(
      "Unable to load dispute dossier.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  if (!row) {
    throw new NotFoundError("Dispute docket not found.");
  }

  const [hydrated] = await hydrateDisputes(admin, [row]);
  return hydrated;
}

/**
 * Executes a binding Admin dispute arbitration ruling (`APPROVE_ADJUSTMENT`,
 * `REJECT_CLAIM`, `MUTUAL_CANCEL`), synchronizing integer CAD cent totals on
 * `disputes`, `matches`, and `listings`, appending `dispute_timeline`,
 * writing `audit_logs`, and notifying both parties (FR-AD-06, BR-11, NFR-14).
 */
export async function resolveDispute(
  ctx: SessionContext,
  disputeId: string,
  input: ResolveDisputeInput,
  requestMeta: { ipAddress: string | null }
): Promise<ResolveDisputeResult> {
  assertAdmin(ctx);
  if (!UUID_REGEX.test(disputeId)) {
    throw new NotFoundError("Dispute docket not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: existing, error: fetchErr } = await admin
    .from("disputes")
    .select("*")
    .eq("id", disputeId)
    .maybeSingle();

  if (fetchErr) {
    throw new ExternalServiceError(
      "Unable to load dispute docket for resolution.",
      "EXTERNAL_SERVICE_ERROR",
      fetchErr
    );
  }

  if (!existing) {
    throw new NotFoundError("Dispute docket not found.");
  }

  if (existing.status === "RESOLVED" || existing.status === "CLOSED") {
    throw new ConflictError(
      `Dispute docket ${existing.docket_number} has already been finalized (${existing.status}).`,
      "DISPUTE_ALREADY_RESOLVED"
    );
  }

  const { data: match, error: matchErr } = await admin
    .from("matches")
    .select("*")
    .eq("id", existing.match_id)
    .single();

  if (matchErr || !match) {
    throw new ExternalServiceError(
      "Unable to load linked match record for arbitration.",
      "EXTERNAL_SERVICE_ERROR",
      matchErr
    );
  }

  const decision: DisputeResolutionDecision = input.decision;
  const nowIso = new Date().toISOString();

  let nextDisputeStatus: Database["public"]["Enums"]["dispute_status"];
  let finalAdjustmentCents: number;
  let netSettlementCents: number;
  let nextMatchOutcome: Database["public"]["Enums"]["match_outcome"];
  let matchFinalPriceCents: number;
  let nextListingStatus: Database["public"]["Enums"]["listing_status"];
  let message: string;

  if (decision === "APPROVE_ADJUSTMENT") {
    finalAdjustmentCents =
      input.adjustmentCents ?? existing.disputed_adjustment_cents;
    if (
      finalAdjustmentCents < 0 ||
      finalAdjustmentCents > existing.agreed_bid_cents
    ) {
      throw new ValidationError(
        "Approved adjustment must be between $0 and the agreed winning bid.",
        {
          adjustmentCents:
            "Deduction cannot exceed the agreed winning bid amount.",
        }
      );
    }

    netSettlementCents = existing.agreed_bid_cents - finalAdjustmentCents;
    nextDisputeStatus = "RESOLVED";
    nextMatchOutcome =
      finalAdjustmentCents > 0 ? "RENEGOTIATED_LOWER" : "COMPLETED";
    matchFinalPriceCents = netSettlementCents;
    nextListingStatus = "COMPLETED";
    message = `Arbitration Ruling Executed: Approved adjustment of $${(
      finalAdjustmentCents / 100
    ).toLocaleString("en-CA")} CAD. Net settlement fixed at $${(
      netSettlementCents / 100
    ).toLocaleString("en-CA")} CAD.`;
  } else if (decision === "REJECT_CLAIM") {
    finalAdjustmentCents = 0;
    netSettlementCents = existing.agreed_bid_cents;
    nextDisputeStatus = "RESOLVED";
    nextMatchOutcome = "COMPLETED";
    matchFinalPriceCents = existing.agreed_bid_cents;
    nextListingStatus = "COMPLETED";
    message = `Arbitration Ruling Executed: Claim dismissed. Original bid of $${(
      existing.agreed_bid_cents / 100
    ).toLocaleString("en-CA")} CAD enforced in full.`;
  } else {
    finalAdjustmentCents = existing.disputed_adjustment_cents;
    netSettlementCents = 0;
    nextDisputeStatus = "CLOSED";
    nextMatchOutcome = "DECLINED_AFTER_INSPECTION";
    matchFinalPriceCents = 0;
    nextListingStatus = "UNSEALED";
    message =
      "Arbitration Ruling Executed: Mutual cancellation and vehicle return ordered.";
  }

  const { error: disputeUpdateErr } = await admin
    .from("disputes")
    .update({
      status: nextDisputeStatus,
      disputed_adjustment_cents: finalAdjustmentCents,
      net_settlement_cents: netSettlementCents,
      resolution_decision: decision,
      compliance_decision_notes: input.notes,
      assigned_admin_id: ctx.userId,
      resolved_at: nowIso,
    })
    .eq("id", existing.id);

  if (disputeUpdateErr) {
    throw new ExternalServiceError(
      "Unable to save dispute resolution.",
      "EXTERNAL_SERVICE_ERROR",
      disputeUpdateErr
    );
  }

  const [matchUpdateRes, listingUpdateRes] = await Promise.all([
    admin
      .from("matches")
      .update({
        outcome: nextMatchOutcome,
        final_price_cents: matchFinalPriceCents,
        outcome_notes: input.notes,
        logged_by_user_id: ctx.userId,
        outcome_logged_at: nowIso,
      })
      .eq("id", match.id),
    admin
      .from("listings")
      .update({ status: nextListingStatus })
      .eq("id", existing.listing_id),
  ]);

  if (matchUpdateRes.error || listingUpdateRes.error) {
    throw new ExternalServiceError(
      "Dispute updated but linked settlement update failed.",
      "EXTERNAL_SERVICE_ERROR",
      matchUpdateRes.error ?? listingUpdateRes.error
    );
  }

  if (decision === "MUTUAL_CANCEL") {
    await admin
      .from("bids")
      .update({ status: "EXPIRED" })
      .eq("id", match.winning_bid_id);
  }

  const adminName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("dispute_timeline").insert({
    dispute_id: existing.id,
    actor_user_id: ctx.userId,
    actor_label: `AutoNexa Arbitration (${adminName})`,
    action: decision,
    note: input.notes,
  });

  const { data: dealerAdmins } = await admin
    .from("dealership_members")
    .select("user_id")
    .eq("dealership_id", match.dealership_id)
    .eq("is_active", true);

  const notifyUserIds = Array.from(
    new Set([match.seller_id, ...(dealerAdmins ?? []).map((m) => m.user_id)])
  );

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: adminName,
      actor_role: ctx.role,
      action: "DISPUTE_RESOLVED",
      entity_type: "dispute",
      entity_id: existing.id,
      provincial_jurisdiction: ctx.profile.province ?? "ON",
      ip_address: requestMeta.ipAddress,
      details: message,
      before_json: {
        status: existing.status,
        disputedAdjustmentCents: existing.disputed_adjustment_cents,
        netSettlementCents: existing.net_settlement_cents,
        matchOutcome: match.outcome,
      },
      after_json: {
        status: nextDisputeStatus,
        decision,
        disputedAdjustmentCents: finalAdjustmentCents,
        netSettlementCents,
        matchOutcome: nextMatchOutcome,
        listingStatus: nextListingStatus,
      },
    }),
    ...(notifyUserIds.length > 0
      ? [
          admin.from("notifications").insert(
            notifyUserIds.map((uid) => ({
              user_id: uid,
              type: "DISPUTE" as const,
              title: `Arbitration ruling issued (${existing.docket_number})`,
              description: message,
              listing_id: existing.listing_id,
              metadata: {
                disputeId: existing.id,
                docketNumber: existing.docket_number,
                decision,
                netSettlementCents,
              },
            }))
          ),
        ]
      : []),
  ]);

  const { data: reloaded, error: reloadErr } = await admin
    .from("disputes")
    .select("*")
    .eq("id", existing.id)
    .single();

  if (reloadErr || !reloaded) {
    throw new ExternalServiceError(
      "Dispute resolved but reload failed.",
      "EXTERNAL_SERVICE_ERROR",
      reloadErr
    );
  }

  const [dispute] = await hydrateDisputes(admin, [reloaded]);

  return {
    dispute,
    decision,
    matchOutcome: nextMatchOutcome,
    listingStatus: nextListingStatus,
    auditAction: "DISPUTE_RESOLVED",
    message,
    serverTime: nowIso,
  };
}
