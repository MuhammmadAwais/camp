import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import { ExternalServiceError, NotFoundError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import type { Database } from "@/lib/supabase/database.types";
import type {
  DamageGrade,
  DealerInventoryResponse,
  DealerQuotaSummary,
  VehicleCarfaxReport,
  VehicleDamageHotspot,
  VehicleInspectionDetails,
  WholesaleAuctionItem,
} from "@/lib/types/dealer";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";

const PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

const emptyToUndefined = (val: unknown): unknown =>
  val === "" || val === null || val === undefined ? undefined : val;

export const dealerInventoryQuerySchema = z.object({
  search: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100).optional()
  ),
  make: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  maxMileageKm: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).max(2_000_000).optional()
  ),
  maxDistanceKm: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(5_000).optional()
  ),
  damageGrade: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : String(val).trim().toUpperCase(),
    z.enum(["A", "B", "C", "D", "ALL"]).optional()
  ),
  province: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : String(val).trim().toUpperCase(),
    z.string().length(2).optional()
  ),
  sortBy: z.preprocess(
    emptyToUndefined,
    z
      .enum(["closing_soon", "mileage_low", "year_new", "distance_near"])
      .default("closing_soon")
  ),
});

export type DealerInventoryQuery = z.output<typeof dealerInventoryQuerySchema>;

type DealerContext = SessionContext & { dealershipId: string };

type PlanJoin = {
  name: string;
  monthly_bid_quota: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeDamageGrade(raw: string): DamageGrade {
  const upper = raw.trim().toUpperCase();
  if (upper === "B" || upper === "C" || upper === "D") return upper;
  return "A";
}

/**
 * BR-04 / H1 Sealed-Bid Invariant:
 * Never compute `RESERVE_MET` or reveal `reserve_price_cents` on dealer endpoints
 * so neither the seller's hidden reserve floor nor competitor bids can be inferred.
 */
export function toReserveStatus(
  reservePriceCents: number | null
): "NO_RESERVE" | "RESERVE_PENDING" {
  if (reservePriceCents === null || reservePriceCents <= 0) {
    return "NO_RESERVE";
  }
  return "RESERVE_PENDING";
}

function formatRegistrationProvince(province: string): string {
  const upper = province.trim().toUpperCase();
  return PROVINCE_NAMES[upper] ?? (upper || "Canada");
}

function extractPlan(rawPlans: unknown): PlanJoin | null {
  const candidate = Array.isArray(rawPlans) ? rawPlans[0] : rawPlans;
  if (!isRecord(candidate)) return null;
  const name = typeof candidate.name === "string" ? candidate.name : undefined;
  const quota =
    typeof candidate.monthly_bid_quota === "number"
      ? candidate.monthly_bid_quota
      : undefined;
  if (!name || quota === undefined) return null;
  return { name, monthly_bid_quota: quota };
}

export function sortPhotos(
  media: ReadonlyArray<{
    public_url: string;
    is_cover: boolean;
    sort_order: number;
  }>
): string[] {
  const ordered = [...media]
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return a.sort_order - b.sort_order;
    })
    .map((m) => m.public_url)
    .filter((url) => url.trim().length > 0);

  return ordered.length > 0 ? ordered : [DEFAULT_THUMBNAIL];
}

function parseCarfaxReport(listing: {
  city: string;
  province: string;
  accident_declaration: boolean;
  accident_count: number;
  carfax_summary_json: Database["public"]["Tables"]["listings"]["Row"]["carfax_summary_json"];
}): VehicleCarfaxReport {
  const raw = isRecord(listing.carfax_summary_json)
    ? listing.carfax_summary_json
    : null;

  const ownersCount =
    raw && typeof raw.ownersCount === "number" && raw.ownersCount >= 1
      ? Math.floor(raw.ownersCount)
      : raw && typeof raw.owners === "number" && raw.owners >= 1
        ? Math.floor(raw.owners)
        : 1;

  const serviceRecordsCount =
    raw &&
    typeof raw.serviceRecordsCount === "number" &&
    raw.serviceRecordsCount >= 0
      ? Math.floor(raw.serviceRecordsCount)
      : raw && typeof raw.serviceRecords === "number" && raw.serviceRecords >= 0
        ? Math.floor(raw.serviceRecords)
        : 0;

  const accidentFree =
    raw && typeof raw.accidentFree === "boolean"
      ? raw.accidentFree &&
        !listing.accident_declaration &&
        listing.accident_count === 0
      : !listing.accident_declaration && listing.accident_count === 0;

  const cityLabel = listing.city.trim();
  const provCode = listing.province.trim().toUpperCase();
  const defaultLocation = cityLabel ? `${cityLabel}, ${provCode}` : provCode;

  const lastReportedCity =
    raw &&
    typeof raw.lastReportedCity === "string" &&
    raw.lastReportedCity.trim().length > 0
      ? raw.lastReportedCity.trim()
      : defaultLocation;

  const registrationProvince =
    raw &&
    typeof raw.registrationProvince === "string" &&
    raw.registrationProvince.trim().length > 0
      ? raw.registrationProvince.trim()
      : formatRegistrationProvince(provCode);

  const odometerRollbackRisk =
    raw && typeof raw.odometerRollbackRisk === "boolean"
      ? raw.odometerRollbackRisk
      : false;

  return {
    ownersCount,
    accidentFree,
    serviceRecordsCount,
    lastReportedCity,
    registrationProvince,
    odometerRollbackRisk,
  };
}

/**
 * Loads active 24h auctions visible on the verified dealer trading floor via RLS,
 * attaching ONLY the calling dealership's own sealed bids and subscription quota.
 * Never returns competitor bid amounts or seller `reserve_price_cents`.
 */
export async function listActiveInventory(
  ctx: DealerContext,
  filters: DealerInventoryQuery
): Promise<DealerInventoryResponse> {
  const nowIso = new Date().toISOString();

  const rpcArgs: Database["public"]["Functions"]["get_dealer_inventory_with_distance"]["Args"] =
    {
      p_dealership_id: ctx.dealershipId,
      p_sort_by: filters.sortBy,
      ...(filters.maxDistanceKm !== undefined
        ? { p_max_distance_km: filters.maxDistanceKm }
        : {}),
      ...(filters.make && filters.make.toUpperCase() !== "ALL"
        ? { p_make: filters.make }
        : {}),
      ...(filters.maxMileageKm !== undefined
        ? { p_max_mileage_km: filters.maxMileageKm }
        : {}),
      ...(filters.damageGrade && filters.damageGrade !== "ALL"
        ? { p_damage_grade: filters.damageGrade }
        : {}),
      ...(filters.province ? { p_province: filters.province } : {}),
      ...(filters.search ? { p_search: filters.search } : {}),
    };

  const [dealershipRes, subscriptionRes, inventoryRes, bidsRes] =
    await Promise.all([
      ctx.supabase
        .from("dealerships")
        .select("id, operating_name, postal_code, city, province, service_radius_km")
        .eq("id", ctx.dealershipId)
        .maybeSingle(),
      ctx.supabase
        .from("subscriptions")
        .select("bids_used, status, plans ( name, monthly_bid_quota )")
        .eq("dealership_id", ctx.dealershipId)
        .maybeSingle(),
      ctx.supabase.rpc("get_dealer_inventory_with_distance", rpcArgs),
      ctx.supabase
        .from("bids")
        .select("listing_id, amount_cents, status")
        .eq("dealership_id", ctx.dealershipId)
        .eq("status", "ACTIVE"),
    ]);

  if (inventoryRes.error) {
    throw new ExternalServiceError(
      "Unable to load active dealer auction inventory.",
      "EXTERNAL_SERVICE_ERROR",
      inventoryRes.error
    );
  }

  if (bidsRes.error) {
    throw new ExternalServiceError(
      "Unable to load dealership bid telemetry.",
      "EXTERNAL_SERVICE_ERROR",
      bidsRes.error
    );
  }

  if (dealershipRes.error) {
    logger.warn("Dealership lookup error while loading dealer feed", {
      actorId: ctx.userId,
      meta: { code: dealershipRes.error.code },
    });
  }

  if (subscriptionRes.error) {
    logger.warn("Subscription lookup error while loading dealer feed", {
      actorId: ctx.userId,
      meta: { code: subscriptionRes.error.code },
    });
  }

  const dealership = dealershipRes.data;
  const inventoryRows = inventoryRes.data ?? [];
  const listingIds = inventoryRows.map((row) => row.id);

  const mediaByListingId = new Map<
    string,
    Array<{ public_url: string; is_cover: boolean; sort_order: number }>
  >();

  if (listingIds.length > 0) {
    const { data: mediaRows, error: mediaErr } = await ctx.supabase
      .from("listing_media")
      .select("listing_id, public_url, is_cover, sort_order")
      .in("listing_id", listingIds);

    if (mediaErr) {
      logger.warn("Listing media lookup error while loading dealer feed", {
        actorId: ctx.userId,
        meta: { code: mediaErr.code },
      });
    } else {
      for (const media of mediaRows ?? []) {
        const list = mediaByListingId.get(media.listing_id) ?? [];
        list.push({
          public_url: media.public_url,
          is_cover: media.is_cover,
          sort_order: media.sort_order,
        });
        mediaByListingId.set(media.listing_id, list);
      }
    }
  }

  const myBidByListingId = new Map<string, number>();
  for (const bid of bidsRes.data ?? []) {
    myBidByListingId.set(bid.listing_id, bid.amount_cents);
  }

  const mappedItems: WholesaleAuctionItem[] = inventoryRows.map((row) => {
    const mediaRows = mediaByListingId.get(row.id) ?? [];
    const photos = sortPhotos(mediaRows);

    return {
      id: row.id,
      vin: row.vin,
      year: row.year,
      make: row.make,
      model: row.model,
      trim: row.vehicle_trim || "",
      mileageKm: row.mileage_km,
      bodyType: row.body_type || "Passenger Vehicle",
      transmission: row.transmission || "Automatic",
      drivetrain: row.drivetrain || "AWD",
      exteriorColor: row.exterior_color || "Not specified",
      interiorColor: row.interior_color || "Not specified",
      province: row.province,
      city: row.city || row.province,
      postalCode: row.postal_code,
      distanceKm: row.distance_km ?? 25,
      damageGrade: normalizeDamageGrade(row.damage_grade),
      damageHotspotCount: row.damage_hotspot_count,
      thumbnailUrl: photos[0] ?? DEFAULT_THUMBNAIL,
      photos,
      photosCount: mediaRows.length,
      auctionEndsAt: row.auction_ends_at ?? nowIso,
      myCurrentBidCents:
        row.my_current_bid_cents ?? myBidByListingId.get(row.id) ?? null,
      totalBidsPlaced: row.bid_count,
      reserveStatus: row.has_reserve ? "RESERVE_PENDING" : "NO_RESERVE",
      carfaxClean: row.carfax_clean,
      keysCount: row.keys_count,
      hasLien: row.has_lien,
    };
  });

  const sub = subscriptionRes.data;
  const plan = extractPlan(sub?.plans);
  const dealerQuota: DealerQuotaSummary = {
    usedThisMonth: sub?.bids_used ?? 0,
    totalMonthlyQuota: plan?.monthly_bid_quota ?? 0,
    activeBidsCount: myBidByListingId.size,
    ...(plan?.name ? { planName: plan.name } : {}),
    subscriptionStatus: sub?.status ?? "NONE",
  };

  return {
    items: mappedItems,
    totalCount: mappedItems.length,
    dealerQuota,
    dealershipName: dealership?.operating_name ?? "Verified Dealership",
    serverTime: nowIso,
  };
}

/**
 * Loads the complete vehicle inspection dossier for a verified dealership.
 * Strict sealed-bid invariant: returns ONLY the caller dealership's own bid and
 * never exposes competitor bids, seller identity, or `reserve_price_cents`.
 */
export async function getDealerAuctionDetail(
  ctx: DealerContext,
  listingId: string
): Promise<VehicleInspectionDetails> {
  if (!UUID_REGEX.test(listingId)) {
    throw new NotFoundError("Vehicle auction not found.");
  }

  const [
    listingRes,
    mediaRes,
    hotspotsRes,
    myBidRes,
    dealershipRes,
    distanceRes,
  ] = await Promise.all([
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
          engine_spec,
          horsepower,
          fuel_type,
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
          carfax_summary_json,
          keys_count,
          has_lien,
          lien_details,
          accident_declaration,
          accident_count,
          accident_details,
          seller_notes
        `
      )
      .eq("id", listingId)
      .maybeSingle(),
    ctx.supabase
      .from("listing_media")
      .select("public_url, is_cover, sort_order")
      .eq("listing_id", listingId)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true }),
    ctx.supabase
      .from("damage_hotspots")
      .select(
        "id, panel, severity, description, viewpoint, x_percent, y_percent, photo_url"
      )
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true }),
    ctx.supabase
      .from("bids")
      .select("amount_cents, status")
      .eq("listing_id", listingId)
      .eq("dealership_id", ctx.dealershipId)
      .neq("status", "VOIDED")
      .neq("status", "WITHDRAWN")
      .maybeSingle(),
    ctx.supabase
      .from("dealerships")
      .select("operating_name, postal_code, city, province")
      .eq("id", ctx.dealershipId)
      .maybeSingle(),
    ctx.supabase.rpc("get_dealership_listing_distances", {
      p_dealership_id: ctx.dealershipId,
      p_listing_ids: [listingId],
    }),
  ]);

  if (listingRes.error) {
    throw new ExternalServiceError(
      "Unable to load vehicle inspection sheet.",
      "EXTERNAL_SERVICE_ERROR",
      listingRes.error
    );
  }

  const listing = listingRes.data;
  if (!listing) {
    throw new NotFoundError("Vehicle auction not found.");
  }

  if (myBidRes.error) {
    throw new ExternalServiceError(
      "Unable to verify dealership bid status.",
      "EXTERNAL_SERVICE_ERROR",
      myBidRes.error
    );
  }

  const myBid = myBidRes.data;
  // Defense-in-depth visibility gate matching RLS: ACTIVE lots, or historical lots this dealership bid on.
  if (listing.status !== "ACTIVE" && !myBid) {
    throw new NotFoundError("Vehicle auction not found.");
  }

  if (mediaRes.error) {
    throw new ExternalServiceError(
      "Unable to load vehicle photo gallery.",
      "EXTERNAL_SERVICE_ERROR",
      mediaRes.error
    );
  }

  if (hotspotsRes.error) {
    throw new ExternalServiceError(
      "Unable to load vehicle condition disclosures.",
      "EXTERNAL_SERVICE_ERROR",
      hotspotsRes.error
    );
  }

  const dealership = dealershipRes.data;
  if (distanceRes.error) {
    logger.warn("PostGIS distance RPC fallback while loading inspection", {
      actorId: ctx.userId,
      meta: { code: distanceRes.error.code },
    });
  }
  const distanceRow = (distanceRes.data ?? [])[0];

  const mediaRows = mediaRes.data ?? [];
  const photos = sortPhotos(mediaRows);
  const damageHotspots: VehicleDamageHotspot[] = (hotspotsRes.data ?? []).map(
    (h) => ({
      id: h.id,
      panel: h.panel,
      severity: h.severity,
      description: h.description ?? "",
      viewpoint: h.viewpoint,
      xPercent: Number(h.x_percent),
      yPercent: Number(h.y_percent),
      ...(h.photo_url ? { imageUrl: h.photo_url } : {}),
    })
  );

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const auctionEndsAt = listing.auction_ends_at ?? listing.closed_at ?? nowIso;
  const isAuctionOpen =
    listing.status === "ACTIVE" &&
    Boolean(
      listing.auction_ends_at &&
        new Date(listing.auction_ends_at).getTime() > nowMs
    );

  return {
    id: listing.id,
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
    distanceKm: distanceRow?.distance_km ?? 25,
    damageGrade: normalizeDamageGrade(listing.damage_grade),
    damageHotspotCount: listing.damage_hotspot_count,
    thumbnailUrl: photos[0] ?? DEFAULT_THUMBNAIL,
    photos,
    photosCount: mediaRows.length,
    auctionEndsAt,
    myCurrentBidCents: myBid?.amount_cents ?? null,
    totalBidsPlaced: listing.bid_count,
    reserveStatus: toReserveStatus(listing.reserve_price_cents),
    carfaxClean: listing.carfax_clean,
    keysCount: listing.keys_count,
    hasLien: listing.has_lien,
    status: listing.status,
    isAuctionOpen,
    dealershipName: dealership?.operating_name ?? "Verified Dealership",
    serverTime: nowIso,
    engineSpec: listing.engine_spec || "Standard Powertrain",
    horsepower: listing.horsepower,
    fuelType: listing.fuel_type || "Gasoline",
    accidentDeclaration: listing.accident_declaration,
    accidentCount: listing.accident_count,
    accidentDetails: listing.accident_details ?? "",
    lienDetails: listing.lien_details ?? "",
    carfaxReport: parseCarfaxReport(listing),
    damageHotspots,
    sellerNotes: listing.seller_notes ?? "",
  };
}
