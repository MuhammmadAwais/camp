import { z } from "zod";
import {
  PROVINCE_CODES,
  normalizePostalCode,
  suggestProvinceFromPostal,
} from "@/lib/canada";
import { validateAndNormalizeVin } from "@/lib/server/adapters/vin.adapter";
import type { SessionContext } from "@/lib/server/auth";
import {
  AppError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AppointmentVoucher,
  AuctionStatus,
  ListingDetailData,
  SellerAuctionItem,
  SellerDashboardData,
  SellerNotificationItem,
  SellerNotificationType,
  UnsealedDealerBid,
} from "@/lib/types/seller";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";
const MAX_LISTING_PHOTOS = 30;
const FALLBACK_MIN_PHOTOS = 8;

const ACTIVE_VIN_STATUSES: readonly Database["public"]["Enums"]["listing_status"][] =
  [
    "DRAFT",
    "PENDING_MODERATION",
    "EDITS_REQUESTED",
    "ACTIVE",
    "UNSEALED",
    "ACCEPTED",
  ];

const UNSEALED_VISIBLE_STATUSES = new Set<AuctionStatus>([
  "UNSEALED",
  "ACCEPTED",
  "COMPLETED",
  "EXPIRED",
]);

const DEFAULT_CHECKLIST = [
  "Original Vehicle Ownership Permit (Green Slip - Part 1 & 2)",
  "Two original master vehicle smart keys",
  "Government-issued photo identification (Driver's License)",
  "Direct Deposit void cheque or wire payout instructions",
];

const hotspotInputSchema = z.object({
  id: z.string().optional(),
  view: z.string().optional(),
  viewpoint: z.string().optional(),
  x: z.number().min(0).max(100).optional(),
  xPercent: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  yPercent: z.number().min(0).max(100).optional(),
  severity: z.enum(["MINOR", "MODERATE", "SEVERE"]),
  areaLabel: z.string().max(120).optional(),
  panel: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  photoUrl: z.string().optional(),
});

const photoInputSchema = z.object({
  id: z.string().optional(),
  storageKey: z.string().optional(),
  s3Key: z.string().optional(),
  publicUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  photoLabel: z.string().optional(),
  isCover: z.boolean().optional(),
});

const legacyDecodedSchema = z
  .object({
    year: z.number().int().min(1980).max(2035).nullable().optional(),
    make: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    trim: z.string().nullable().optional(),
    bodyStyle: z.string().nullable().optional(),
    engine: z.string().nullable().optional(),
    transmission: z.string().nullable().optional(),
    drivetrain: z.string().nullable().optional(),
    fuelType: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const specsInputSchema = z
  .object({
    mileageKm: z.number().int().min(0).max(2_000_000).optional(),
    transmission: z.string().trim().max(120).nullable().optional(),
    drivetrain: z.string().trim().max(120).nullable().optional(),
    exteriorColor: z.string().trim().max(120).nullable().optional(),
    interiorColor: z.string().trim().max(120).nullable().optional(),
    keysCount: z.number().int().min(1).max(10).optional(),
    accidentDeclaration: z.boolean().optional(),
    accidentCount: z.number().int().min(0).max(50).optional(),
    accidentDetails: z.string().max(1000).optional(),
    hasLien: z.boolean().optional(),
    lienDetails: z.string().max(1000).optional(),
  })
  .optional();

export const createListingPayloadSchema = z.object({
  vin: z.string().min(1, "VIN is required"),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  city: z.string().trim().max(120).optional(),
  year: z.number().int().min(1980).max(2035).optional(),
  make: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(80).optional(),
  trim: z.string().trim().max(80).optional(),
  bodyStyle: z.string().trim().max(120).nullable().optional(),
  engine: z.string().trim().max(120).nullable().optional(),
  transmission: z.string().trim().max(120).nullable().optional(),
  drivetrain: z.string().trim().max(120).nullable().optional(),
  fuelType: z.string().trim().max(120).nullable().optional(),
  exteriorColor: z.string().trim().max(120).nullable().optional(),
  interiorColor: z.string().trim().max(120).nullable().optional(),
  mileageKm: z.number().int().min(0).max(2_000_000).optional(),
  keysCount: z.number().int().min(1).max(10).optional(),
  accidentDeclaration: z.boolean().optional(),
  accidentCount: z.number().int().min(0).max(50).optional(),
  accidentDetails: z.string().max(1000).optional(),
  hasLien: z.boolean().optional(),
  lienDetails: z.string().max(1000).optional(),
  sellerNotes: z.string().max(2000).optional(),
  decodedVehicle: legacyDecodedSchema,
  specs: specsInputSchema,
  damageHotspots: z.array(hotspotInputSchema).optional().default([]),
  photos: z.array(photoInputSchema).optional(),
  photoUrls: z.array(z.string()).optional(),
  coverPhotoUrl: z.string().optional(),
  reservePriceCents: z.number().int().min(0).nullable(),
  declarationOwnerAttested: z.literal(true, {
    message: "You must attest to legal ownership to list this vehicle",
  }),
  declarationAccurateCondition: z.literal(true, {
    message: "You must declare vehicle condition accurately",
  }),
  declarationNoUnpaidFines: z.literal(true, {
    message: "You must authorize lien and settlement terms",
  }),
});

export type CreateListingPayload = z.output<typeof createListingPayloadSchema>;

export type CreateListingResponse = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileageKm: number;
  status: AuctionStatus;
  reservePriceCents: number;
  coverPhotoUrl: string;
  photoCount: number;
  hotspotCount: number;
  createdAt: string;
  auctionEndsAt: string | null;
  message: string;
};

type DamageSeverity = Database["public"]["Enums"]["damage_severity"];

function computeDamageGrade(
  hotspots: ReadonlyArray<{ severity: DamageSeverity }>
): "A" | "B" | "C" | "D" {
  if (hotspots.length === 0) return "A";
  if (hotspots.some((h) => h.severity === "SEVERE")) return "D";
  if (hotspots.length >= 3 || hotspots.some((h) => h.severity === "MODERATE")) {
    return "C";
  }
  return "B";
}

function normalizeProvince(raw?: string | null): string {
  if (raw) {
    const upper = raw.trim().toUpperCase();
    if (PROVINCE_CODES.some((code) => code === upper)) {
      return upper;
    }
  }
  return "ON";
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// TODO(senior-review): Replace centroid Haversine approximation with PostGIS ST_Distance RPC in Prompt B5.1.
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(earthRadiusKm * c));
}

function mapNotificationType(
  dbType: Database["public"]["Enums"]["notification_type"]
): SellerNotificationType {
  if (dbType === "BID" || dbType === "KYC" || dbType === "MODERATION") {
    return dbType;
  }
  return "SYSTEM";
}

async function readMinPhotoCount(
  admin: ReturnType<typeof createAdminSupabaseClient>
): Promise<number> {
  const { data } = await admin
    .from("platform_config")
    .select("value_json")
    .eq("key", "min_photo_count")
    .maybeSingle();

  const raw = data?.value_json;
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return FALLBACK_MIN_PHOTOS;
}

type NormalizedPhoto = {
  storageKey: string;
  publicUrl: string;
  fileName: string;
  fileSizeBytes: number | null;
  mimeType: string;
  isCover: boolean;
  sortOrder: number;
};

function normalizePhotos(
  payload: CreateListingPayload
): NormalizedPhoto[] {
  const items: Array<{
    storageKey: string;
    publicUrl: string;
    fileName: string;
    fileSizeBytes: number | null;
    mimeType: string;
    isCover: boolean;
  }> = [];

  if (payload.photos && payload.photos.length > 0) {
    payload.photos.forEach((photo, idx) => {
      const publicUrl = (photo.publicUrl ?? photo.previewUrl ?? "").trim();
      if (!publicUrl) return;
      const fileName =
        photo.fileName?.trim() || `vehicle-photo-${idx + 1}.webp`;
      const storageKey =
        photo.storageKey?.trim() ||
        photo.s3Key?.trim() ||
        `uploads/${fileName}`;
      items.push({
        storageKey,
        publicUrl,
        fileName,
        fileSizeBytes: photo.fileSizeBytes ?? null,
        mimeType: photo.mimeType?.trim() || "image/webp",
        isCover:
          Boolean(photo.isCover) ||
          (Boolean(payload.coverPhotoUrl) &&
            publicUrl === payload.coverPhotoUrl?.trim()),
      });
    });
  } else if (payload.photoUrls && payload.photoUrls.length > 0) {
    payload.photoUrls.forEach((rawUrl, idx) => {
      const publicUrl = rawUrl.trim();
      if (!publicUrl) return;
      const fileName = `vehicle-photo-${idx + 1}.webp`;
      items.push({
        storageKey: `uploads/${fileName}`,
        publicUrl,
        fileName,
        fileSizeBytes: null,
        mimeType: "image/webp",
        isCover: Boolean(
          payload.coverPhotoUrl && publicUrl === payload.coverPhotoUrl.trim()
        ),
      });
    });
  }

  let hasExplicitCover = items.some((item) => item.isCover);
  return items.map((item, idx) => {
    const isCover = hasExplicitCover
      ? item.isCover &&
        items.findIndex((candidate) => candidate.isCover) === idx
      : idx === 0;
    if (isCover) hasExplicitCover = true;
    return {
      ...item,
      isCover,
      sortOrder: idx,
    };
  });
}

/**
 * Creates a seller vehicle listing in `PENDING_MODERATION` state after enforcing
 * KYC verification (BR-01), active-VIN uniqueness (BR-02), and integer CAD cents (NFR-14).
 */
export async function createListing(
  ctx: SessionContext,
  payload: CreateListingPayload,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
): Promise<CreateListingResponse> {
  if (ctx.role !== "ADMIN" && ctx.kycStatus !== "VERIFIED") {
    throw new ForbiddenError(
      "Government ID verification (KYC) must be completed before creating a listing.",
      "KYC_REQUIRED"
    );
  }

  const vin = validateAndNormalizeVin(payload.vin);
  const year = payload.year ?? payload.decodedVehicle?.year ?? null;
  const make = (payload.make ?? payload.decodedVehicle?.make ?? "").trim();
  const model = (payload.model ?? payload.decodedVehicle?.model ?? "").trim();
  const trim = (payload.trim ?? payload.decodedVehicle?.trim ?? "").trim();
  const mileageKm = payload.mileageKm ?? payload.specs?.mileageKm ?? null;

  const missingFields: Record<string, string> = {};
  if (year === null) missingFields.year = "Model year is required";
  if (!make) missingFields.make = "Make is required";
  if (!model) missingFields.model = "Model is required";
  if (mileageKm === null) missingFields.mileageKm = "Odometer mileage is required";

  if (Object.keys(missingFields).length > 0) {
    throw new ValidationError("Some vehicle details are required.", missingFields);
  }

  const admin = createAdminSupabaseClient();
  const minPhotoCount = await readMinPhotoCount(admin);
  const normalizedPhotos = normalizePhotos(payload);

  if (normalizedPhotos.length < minPhotoCount) {
    throw new ValidationError(
      `At least ${minPhotoCount} vehicle photos are required to submit a listing.`,
      {
        photos: `Please upload at least ${minPhotoCount} photos.`,
      }
    );
  }

  if (normalizedPhotos.length > MAX_LISTING_PHOTOS) {
    throw new ValidationError(
      `Maximum ${MAX_LISTING_PHOTOS} photos allowed per listing.`,
      {
        photos: `Maximum ${MAX_LISTING_PHOTOS} photos allowed per listing.`,
      }
    );
  }

  const { data: activeExisting, error: vinCheckErr } = await admin
    .from("listings")
    .select("id")
    .eq("vin", vin)
    .in("status", ACTIVE_VIN_STATUSES)
    .maybeSingle();

  if (vinCheckErr) {
    throw new ExternalServiceError(
      "Unable to verify VIN uniqueness.",
      "EXTERNAL_SERVICE_ERROR",
      vinCheckErr
    );
  }

  if (activeExisting) {
    throw new ConflictError(
      "This VIN already has an active listing on AutoNexa.",
      "ACTIVE_VIN_EXISTS",
      { vin }
    );
  }

  const rawPostal = payload.postalCode?.trim() || ctx.profile.postal_code || "M5V 2T6";
  const postalCode = normalizePostalCode(rawPostal);
  const fsaPrefix = postalCode.slice(0, 3).toUpperCase();

  const { data: centroid } =
    fsaPrefix.length === 3
      ? await admin
          .from("postal_centroids")
          .select("city, province, latitude, longitude")
          .eq("postal_prefix", fsaPrefix)
          .maybeSingle()
      : { data: null };

  const province = normalizeProvince(
    payload.province ??
      centroid?.province ??
      suggestProvinceFromPostal(postalCode) ??
      ctx.profile.province
  );
  const city =
    payload.city?.trim() || centroid?.city || ctx.profile.city || "";
  const locationWkt = centroid
    ? `SRID=4326;POINT(${centroid.longitude} ${centroid.latitude})`
    : null;

  const damageHotspots = payload.damageHotspots ?? [];
  const damageGrade = computeDamageGrade(damageHotspots);
  const reservePriceCents = payload.reservePriceCents ?? 0;

  const { data: createdListing, error: insertErr } = await ctx.supabase
    .from("listings")
    .insert({
      seller_id: ctx.userId,
      vin,
      year: year!,
      make,
      model,
      trim,
      body_type: payload.bodyStyle ?? payload.decodedVehicle?.bodyStyle ?? null,
      engine_spec: payload.engine ?? payload.decodedVehicle?.engine ?? null,
      fuel_type: payload.fuelType ?? payload.decodedVehicle?.fuelType ?? null,
      mileage_km: mileageKm!,
      transmission:
        payload.transmission ??
        payload.specs?.transmission ??
        payload.decodedVehicle?.transmission ??
        null,
      drivetrain:
        payload.drivetrain ??
        payload.specs?.drivetrain ??
        payload.decodedVehicle?.drivetrain ??
        null,
      exterior_color:
        payload.exteriorColor ?? payload.specs?.exteriorColor ?? null,
      interior_color:
        payload.interiorColor ?? payload.specs?.interiorColor ?? null,
      keys_count: payload.keysCount ?? payload.specs?.keysCount ?? 2,
      accident_declaration:
        payload.accidentDeclaration ??
        payload.specs?.accidentDeclaration ??
        false,
      accident_count:
        payload.accidentCount ?? payload.specs?.accidentCount ?? 0,
      accident_details:
        payload.accidentDetails ?? payload.specs?.accidentDetails ?? "",
      has_lien: payload.hasLien ?? payload.specs?.hasLien ?? false,
      lien_details: payload.lienDetails ?? payload.specs?.lienDetails ?? "",
      seller_notes: payload.sellerNotes ?? null,
      damage_grade: damageGrade,
      damage_hotspot_count: damageHotspots.length,
      postal_code: postalCode,
      city,
      province,
      location: locationWkt,
      reserve_price_cents: reservePriceCents,
      status: "PENDING_MODERATION",
      declaration_owner_attested: true,
      declaration_accurate_condition: true,
      declaration_no_unpaid_fines: true,
    })
    .select("*")
    .single();

  if (insertErr || !createdListing) {
    if (insertErr?.code === "23505") {
      throw new ConflictError(
        "This VIN already has an active listing on AutoNexa.",
        "ACTIVE_VIN_EXISTS",
        { vin }
      );
    }
    throw new ExternalServiceError(
      "Unable to save vehicle listing.",
      "EXTERNAL_SERVICE_ERROR",
      insertErr
    );
  }

  try {
    const mediaRows: Database["public"]["Tables"]["listing_media"]["Insert"][] =
      normalizedPhotos.map((photo) => ({
        listing_id: createdListing.id,
        storage_key: photo.storageKey,
        public_url: photo.publicUrl,
        file_name: photo.fileName,
        file_size_bytes: photo.fileSizeBytes,
        mime_type: photo.mimeType,
        is_cover: photo.isCover,
        sort_order: photo.sortOrder,
      }));

    const { error: mediaErr } = await ctx.supabase
      .from("listing_media")
      .insert(mediaRows);

    if (mediaErr) {
      throw new ExternalServiceError(
        "Unable to attach listing photos.",
        "EXTERNAL_SERVICE_ERROR",
        mediaErr
      );
    }

    if (damageHotspots.length > 0) {
      const hotspotRows: Database["public"]["Tables"]["damage_hotspots"]["Insert"][] =
        damageHotspots.map((hotspot) => ({
          listing_id: createdListing.id,
          viewpoint: hotspot.view ?? hotspot.viewpoint ?? "front",
          x_percent: hotspot.x ?? hotspot.xPercent ?? 50,
          y_percent: hotspot.y ?? hotspot.yPercent ?? 50,
          panel: hotspot.areaLabel ?? hotspot.panel ?? "Exterior Panel",
          severity: hotspot.severity,
          description: hotspot.description ?? "",
          photo_url: hotspot.photoUrl ?? null,
        }));

      const { error: hotspotErr } = await ctx.supabase
        .from("damage_hotspots")
        .insert(hotspotRows);

      if (hotspotErr) {
        throw new ExternalServiceError(
          "Unable to save vehicle condition markers.",
          "EXTERNAL_SERVICE_ERROR",
          hotspotErr
        );
      }
    }

    const actorName =
      `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

    await Promise.all([
      admin.from("audit_logs").insert({
        actor_id: ctx.userId,
        actor_name: actorName,
        actor_role: ctx.role,
        action: "LISTING_CREATED",
        entity_type: "listing",
        entity_id: createdListing.id,
        provincial_jurisdiction: province,
        ip_address: requestMeta.ipAddress,
        after_json: {
          vin,
          year: createdListing.year,
          make: createdListing.make,
          model: createdListing.model,
          status: createdListing.status,
          reservePriceCents,
          photoCount: mediaRows.length,
          hotspotCount: damageHotspots.length,
        },
      }),
      admin.from("notifications").insert({
        user_id: ctx.userId,
        type: "MODERATION",
        title: "Listing submitted for moderation",
        description: `Your ${createdListing.year} ${createdListing.make} ${createdListing.model} is queued for AutoNexa specialist verification before entering the 24h dealer auction floor.`,
        listing_id: createdListing.id,
        metadata: { vin, status: createdListing.status },
      }),
    ]);

    const coverUrl =
      normalizedPhotos.find((p) => p.isCover)?.publicUrl ??
      normalizedPhotos[0]?.publicUrl ??
      DEFAULT_THUMBNAIL;

    return {
      id: createdListing.id,
      vin: createdListing.vin,
      year: createdListing.year,
      make: createdListing.make,
      model: createdListing.model,
      trim: createdListing.trim,
      mileageKm: createdListing.mileage_km,
      status: createdListing.status,
      reservePriceCents: createdListing.reserve_price_cents ?? 0,
      coverPhotoUrl: coverUrl,
      photoCount: normalizedPhotos.length,
      hotspotCount: damageHotspots.length,
      createdAt: createdListing.created_at,
      auctionEndsAt: createdListing.auction_ends_at,
      message:
        "Listing successfully submitted for dealer wholesale auction moderation.",
    };
  } catch (error: unknown) {
    await admin.from("listings").delete().eq("id", createdListing.id);
    throw error;
  }
}

/**
 * Loads real seller portfolio aggregates, listings (bidCount only, zero sealed amounts),
 * and recent seller notifications via Postgres RLS.
 */
export async function getSellerDashboard(
  ctx: SessionContext
): Promise<SellerDashboardData> {
  const [listingsRes, matchesRes, notificationsRes] = await Promise.all([
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
        status,
        reserve_price_cents,
        bid_count,
        auction_started_at,
        auction_ends_at,
        province,
        city,
        created_at,
        listing_media (
          public_url,
          is_cover,
          sort_order
        )
      `
      )
      .eq("seller_id", ctx.userId)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("matches")
      .select("final_price_cents, agreed_amount_cents")
      .eq("seller_id", ctx.userId)
      .eq("outcome", "COMPLETED"),
    ctx.supabase
      .from("notifications")
      .select("id, title, description, created_at, type, read, listing_id")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (listingsRes.error) {
    throw new ExternalServiceError(
      "Unable to load seller dashboard listings.",
      "EXTERNAL_SERVICE_ERROR",
      listingsRes.error
    );
  }

  const rows = listingsRes.data ?? [];
  const auctions: SellerAuctionItem[] = rows.map((row) => {
    const mediaList = Array.isArray(row.listing_media) ? row.listing_media : [];
    const sortedMedia = [...mediaList].sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return a.sort_order - b.sort_order;
    });

    return {
      id: row.id,
      vin: row.vin,
      year: row.year,
      make: row.make,
      model: row.model,
      trim: row.trim || undefined,
      mileageKm: row.mileage_km,
      status: row.status,
      thumbnailUrl: sortedMedia[0]?.public_url ?? DEFAULT_THUMBNAIL,
      reservePriceCents: row.reserve_price_cents ?? 0,
      bidCount: row.bid_count,
      auctionStartedAt: row.auction_started_at ?? undefined,
      auctionEndsAt: row.auction_ends_at ?? undefined,
      province: row.province,
      city: row.city || row.province,
      createdAt: row.created_at,
    };
  });

  const activeAuctionsCount = auctions.filter(
    (item) => item.status === "ACTIVE"
  ).length;
  const totalBidsReceived = auctions.reduce(
    (sum, item) => sum + item.bidCount,
    0
  );
  const completedSalesCount = auctions.filter(
    (item) => item.status === "COMPLETED"
  ).length;
  const totalValueEarnedCents = (matchesRes.data ?? []).reduce(
    (sum, match) => sum + (match.final_price_cents ?? match.agreed_amount_cents),
    0
  );

  const notifications: SellerNotificationItem[] = (
    notificationsRes.data ?? []
  ).map((notif) => ({
    id: notif.id,
    title: notif.title,
    description: notif.description,
    timestamp: notif.created_at,
    type: mapNotificationType(notif.type),
    read: notif.read,
    listingId: notif.listing_id ?? undefined,
  }));

  return {
    stats: {
      activeAuctionsCount,
      totalBidsReceived,
      completedSalesCount,
      totalValueEarnedCents,
    },
    auctions,
    notifications,
  };
}

/**
 * Loads seller listing dossier detail.
 *
 * CRITICAL INVARIANT (BR-04 / H1 / AC-04):
 * Strictly omits `unsealedBids`, `selectedBid`, and `appointmentVoucher`
 * unless DB `listings.status IN ('UNSEALED','ACCEPTED','COMPLETED','EXPIRED')`.
 */
export async function getSellerListingDetail(
  ctx: SessionContext,
  listingId: string
): Promise<ListingDetailData> {
  if (!UUID_REGEX.test(listingId)) {
    throw new NotFoundError("Listing not found.");
  }

  const { data: listing, error: listingErr } = await ctx.supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (listingErr) {
    throw new ExternalServiceError(
      "Unable to load listing details.",
      "EXTERNAL_SERVICE_ERROR",
      listingErr
    );
  }

  if (!listing) {
    throw new NotFoundError("Listing not found.");
  }

  if (ctx.role !== "ADMIN" && listing.seller_id !== ctx.userId) {
    throw new ForbiddenError(
      "You do not have permission to view this listing."
    );
  }

  const [mediaRes, hotspotsRes] = await Promise.all([
    ctx.supabase
      .from("listing_media")
      .select("id, public_url, is_cover, sort_order")
      .eq("listing_id", listing.id)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true }),
    ctx.supabase
      .from("damage_hotspots")
      .select("id, panel, severity, description")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: true }),
  ]);

  const photos = (mediaRes.data ?? []).map((item) => ({
    id: item.id,
    url: item.public_url,
    isCover: item.is_cover,
  }));

  const coverUrl =
    photos.find((p) => p.isCover)?.url ?? photos[0]?.url ?? DEFAULT_THUMBNAIL;

  const base: ListingDetailData = {
    auction: {
      id: listing.id,
      vin: listing.vin,
      year: listing.year,
      make: listing.make,
      model: listing.model,
      trim: listing.trim || undefined,
      mileageKm: listing.mileage_km,
      status: listing.status,
      thumbnailUrl: coverUrl,
      reservePriceCents: listing.reserve_price_cents ?? 0,
      bidCount: listing.bid_count,
      auctionStartedAt: listing.auction_started_at ?? undefined,
      auctionEndsAt: listing.auction_ends_at ?? undefined,
      province: listing.province,
      city: listing.city || listing.province,
      createdAt: listing.created_at,
    },
    photos,
    damageHotspots: (hotspotsRes.data ?? []).map((spot) => ({
      id: spot.id,
      panel: spot.panel,
      severity: spot.severity,
      description: spot.description ?? undefined,
    })),
    specs: {
      transmission: listing.transmission ?? undefined,
      drivetrain: listing.drivetrain ?? undefined,
      exteriorColor: listing.exterior_color ?? undefined,
      interiorColor: listing.interior_color ?? undefined,
      keysCount: listing.keys_count,
      hasLien: listing.has_lien,
      accidentDeclaration: listing.accident_declaration,
    },
  };

  if (!UNSEALED_VISIBLE_STATUSES.has(listing.status)) {
    return base;
  }

  const { data: bidRows, error: bidsErr } = await ctx.supabase
    .from("bids")
    .select(
      "id, dealership_id, amount_cents, created_at, revised_at, status"
    )
    .eq("listing_id", listing.id)
    .neq("status", "VOIDED")
    .order("amount_cents", { ascending: false });

  if (bidsErr) {
    throw new ExternalServiceError(
      "Unable to load unsealed dealer bids.",
      "EXTERNAL_SERVICE_ERROR",
      bidsErr
    );
  }

  const bids = bidRows ?? [];
  const admin = createAdminSupabaseClient();
  const dealershipIds = Array.from(new Set(bids.map((b) => b.dealership_id)));

  const dealershipMap = new Map<
    string,
    Database["public"]["Tables"]["dealerships"]["Row"]
  >();
  if (dealershipIds.length > 0) {
    const { data: dealerRows } = await admin
      .from("dealerships")
      .select("*")
      .in("id", dealershipIds);

    for (const dealer of dealerRows ?? []) {
      dealershipMap.set(dealer.id, dealer);
    }
  }

  const fsaPrefixes = Array.from(
    new Set([
      listing.postal_code.slice(0, 3).toUpperCase(),
      ...Array.from(dealershipMap.values()).map((d) =>
        d.postal_code.slice(0, 3).toUpperCase()
      ),
    ])
  ).filter((prefix) => prefix.length === 3);

  const centroidMap = new Map<
    string,
    { latitude: number; longitude: number }
  >();
  if (fsaPrefixes.length > 0) {
    const { data: centroids } = await admin
      .from("postal_centroids")
      .select("postal_prefix, latitude, longitude")
      .in("postal_prefix", fsaPrefixes);

    for (const c of centroids ?? []) {
      centroidMap.set(c.postal_prefix, {
        latitude: c.latitude,
        longitude: c.longitude,
      });
    }
  }

  const listingCentroid = centroidMap.get(
    listing.postal_code.slice(0, 3).toUpperCase()
  );

  const unsealedBids: UnsealedDealerBid[] = bids.map((bid) => {
    const dealer = dealershipMap.get(bid.dealership_id);
    const dealerCentroid = dealer
      ? centroidMap.get(dealer.postal_code.slice(0, 3).toUpperCase())
      : undefined;

    const distanceKm =
      listingCentroid && dealerCentroid
        ? haversineDistanceKm(
            listingCentroid.latitude,
            listingCentroid.longitude,
            dealerCentroid.latitude,
            dealerCentroid.longitude
          )
        : 25;

    return {
      id: bid.id,
      dealershipId: bid.dealership_id,
      dealershipName: dealer?.operating_name ?? "Licensed Dealership",
      omvicNumber: dealer?.license_number ?? "VERIFIED",
      province: dealer?.province ?? listing.province,
      city: dealer?.city ?? listing.city ?? "Toronto",
      rating: Number(dealer?.rating ?? 5),
      reviewCount: dealer?.review_count ?? 0,
      bidAmountCents: bid.amount_cents,
      distanceKm,
      placedAt: bid.revised_at ?? bid.created_at,
      payoutSpeedDays: dealer?.payout_speed_days ?? 1,
      certifiedPreInspection: dealer?.certified_pre_inspection ?? false,
    };
  });

  if (listing.status !== "ACCEPTED" && listing.status !== "COMPLETED") {
    return {
      ...base,
      unsealedBids,
    };
  }

  const { data: matchRow } = await ctx.supabase
    .from("matches")
    .select("*")
    .eq("listing_id", listing.id)
    .maybeSingle();

  if (!matchRow) {
    return {
      ...base,
      unsealedBids,
    };
  }

  const selectedBid = unsealedBids.find(
    (bid) => bid.id === matchRow.winning_bid_id
  );
  const winningDealer = dealershipMap.get(matchRow.dealership_id);

  const appointmentVoucher: AppointmentVoucher = {
    voucherCode: matchRow.voucher_code,
    dealershipName:
      winningDealer?.operating_name ??
      selectedBid?.dealershipName ??
      "Licensed Dealership",
    address: winningDealer?.street_address ?? "Confirmed Dealership Location",
    city: winningDealer?.city ?? selectedBid?.city ?? listing.city,
    province: winningDealer?.province ?? listing.province,
    postalCode: winningDealer?.postal_code ?? "",
    contactPhone: winningDealer?.contact_phone ?? "",
    contactEmail: winningDealer?.contact_email ?? "",
    operatingHours:
      winningDealer?.operating_hours ??
      "Monday - Saturday: 9:00 AM - 6:00 PM",
    acceptedOfferCents: matchRow.agreed_amount_cents,
    expiresAt: matchRow.accept_expires_at,
    checklist: DEFAULT_CHECKLIST,
  };

  return {
    ...base,
    unsealedBids,
    ...(selectedBid ? { selectedBid } : {}),
    appointmentVoucher,
  };
}
