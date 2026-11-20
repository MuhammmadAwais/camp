import { z } from "zod";
import { normalizePostalCode } from "@/lib/canada";
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

const DEFAULT_THUMBNAIL = "/showcase-cars-with-bg/2025-Toyota-4runner.png";

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

type CentroidPoint = {
  latitude: number;
  longitude: number;
};

type PlanJoin = {
  name: string;
  monthly_bid_quota: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeDamageGrade(raw: string): DamageGrade {
  const upper = raw.trim().toUpperCase();
  if (upper === "B" || upper === "C" || upper === "D") return upper;
  return "A";
}

/**
 * BR-04 / H1 Sealed-Bid Invariant:
 * Never compute `RESERVE_MET` or reveal `reserve_price_cents` on dealer endpoints
 * so neither the seller's hidden reserve floor nor competitor bids can be inferred.
 */
function toReserveStatus(
  reservePriceCents: number | null
): "NO_RESERVE" | "RESERVE_PENDING" {
  if (reservePriceCents === null || reservePriceCents <= 0) {
    return "NO_RESERVE";
  }
  return "RESERVE_PENDING";
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// TODO(senior-review): Replace centroid Haversine approximation with PostGIS ST_DWithin / ST_Distance RPC in Prompt B5.1.
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

function extractFsa(postalCode: string | null | undefined): string | null {
  if (!postalCode) return null;
  const normalized = normalizePostalCode(postalCode).replace(/\s+/g, "");
  return normalized.length >= 3 ? normalized.slice(0, 3).toUpperCase() : null;
}

function computeDistanceKm(params: {
  dealerPostal?: string | null;
  listingPostal?: string | null;
  dealerCity?: string | null;
  dealerProvince?: string | null;
  listingCity?: string | null;
  listingProvince?: string | null;
  centroidMap: Map<string, CentroidPoint>;
}): number {
  const dealerFsa = extractFsa(params.dealerPostal);
  const listingFsa = extractFsa(params.listingPostal);

  if (dealerFsa && listingFsa) {
    if (dealerFsa === listingFsa) return 5;
    const origin = params.centroidMap.get(dealerFsa);
    const dest = params.centroidMap.get(listingFsa);
    if (origin && dest) {
      return haversineDistanceKm(
        origin.latitude,
        origin.longitude,
        dest.latitude,
        dest.longitude
      );
    }
  }

  const dCity = (params.dealerCity ?? "").trim().toLowerCase();
  const lCity = (params.listingCity ?? "").trim().toLowerCase();
  if (dCity && lCity && dCity === lCity) {
    return 10;
  }

  const dProv = (params.dealerProvince ?? "").trim().toUpperCase();
  const lProv = (params.listingProvince ?? "").trim().toUpperCase();
  if (dProv && lProv && dProv === lProv) {
    return 45;
  }

  return 350;
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

function sortPhotos(
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

  const [dealershipRes, subscriptionRes, listingsRes, bidsRes] =
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
          auction_ends_at,
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
        .eq("status", "ACTIVE")
        .gt("auction_ends_at", nowIso)
        .order("auction_ends_at", { ascending: true }),
      ctx.supabase
        .from("bids")
        .select("listing_id, amount_cents, status")
        .eq("dealership_id", ctx.dealershipId)
        .eq("status", "ACTIVE"),
    ]);

  if (listingsRes.error) {
    throw new ExternalServiceError(
      "Unable to load active dealer auction inventory.",
      "EXTERNAL_SERVICE_ERROR",
      listingsRes.error
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
  const listings = listingsRes.data ?? [];

  const fsaSet = new Set<string>();
  const dealerFsa = extractFsa(dealership?.postal_code);
  if (dealerFsa) fsaSet.add(dealerFsa);
  for (const row of listings) {
    const fsa = extractFsa(row.postal_code);
    if (fsa) fsaSet.add(fsa);
  }

  const centroidMap = new Map<string, CentroidPoint>();
  if (fsaSet.size > 0) {
    const { data: centroids, error: centroidErr } = await ctx.supabase
      .from("postal_centroids")
      .select("postal_prefix, latitude, longitude")
      .in("postal_prefix", Array.from(fsaSet));

    if (centroidErr) {
      logger.warn("Postal centroid lookup error while loading dealer feed", {
        actorId: ctx.userId,
        meta: { code: centroidErr.code },
      });
    } else {
      for (const c of centroids ?? []) {
        centroidMap.set(c.postal_prefix.toUpperCase(), {
          latitude: Number(c.latitude),
          longitude: Number(c.longitude),
        });
      }
    }
  }

  const myBidByListingId = new Map<string, number>();
  for (const bid of bidsRes.data ?? []) {
    myBidByListingId.set(bid.listing_id, bid.amount_cents);
  }

  const mappedItems: WholesaleAuctionItem[] = listings.map((row) => {
    const mediaRows = Array.isArray(row.listing_media) ? row.listing_media : [];
    const photos = sortPhotos(mediaRows);

    return {
      id: row.id,
      vin: row.vin,
      year: row.year,
      make: row.make,
      model: row.model,
      trim: row.trim || "",
      mileageKm: row.mileage_km,
      bodyType: row.body_type || "Passenger Vehicle",
      transmission: row.transmission || "Automatic",
      drivetrain: row.drivetrain || "AWD",
      exteriorColor: row.exterior_color || "Not specified",
      interiorColor: row.interior_color || "Not specified",
      province: row.province,
      city: row.city || row.province,
      postalCode: row.postal_code,
      distanceKm: computeDistanceKm({
        dealerPostal: dealership?.postal_code,
        listingPostal: row.postal_code,
        dealerCity: dealership?.city,
        dealerProvince: dealership?.province,
        listingCity: row.city,
        listingProvince: row.province,
        centroidMap,
      }),
      damageGrade: normalizeDamageGrade(row.damage_grade),
      damageHotspotCount: row.damage_hotspot_count,
      thumbnailUrl: photos[0] ?? DEFAULT_THUMBNAIL,
      photos,
      photosCount: mediaRows.length,
      auctionEndsAt: row.auction_ends_at ?? nowIso,
      myCurrentBidCents: myBidByListingId.get(row.id) ?? null,
      totalBidsPlaced: row.bid_count,
      reserveStatus: toReserveStatus(row.reserve_price_cents),
      carfaxClean: row.carfax_clean,
      keysCount: row.keys_count,
      hasLien: row.has_lien,
    };
  });

  const searchLower = filters.search?.toLowerCase();
  const makeUpper = filters.make?.toUpperCase();
  const filteredItems = mappedItems
    .filter((item) => {
      if (
        makeUpper &&
        makeUpper !== "ALL" &&
        item.make.toUpperCase() !== makeUpper
      ) {
        return false;
      }
      if (
        filters.maxMileageKm !== undefined &&
        item.mileageKm > filters.maxMileageKm
      ) {
        return false;
      }
      if (
        filters.maxDistanceKm !== undefined &&
        item.distanceKm > filters.maxDistanceKm
      ) {
        return false;
      }
      if (
        filters.damageGrade &&
        filters.damageGrade !== "ALL" &&
        item.damageGrade !== filters.damageGrade
      ) {
        return false;
      }
      if (filters.province && item.province.toUpperCase() !== filters.province) {
        return false;
      }
      if (searchLower) {
        const matched =
          item.make.toLowerCase().includes(searchLower) ||
          item.model.toLowerCase().includes(searchLower) ||
          item.trim.toLowerCase().includes(searchLower) ||
          item.vin.toLowerCase().includes(searchLower) ||
          item.city.toLowerCase().includes(searchLower);
        if (!matched) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "mileage_low") {
        return a.mileageKm - b.mileageKm;
      }
      if (filters.sortBy === "year_new") {
        return b.year - a.year;
      }
      if (filters.sortBy === "distance_near") {
        return a.distanceKm - b.distanceKm;
      }
      return (
        new Date(a.auctionEndsAt).getTime() -
        new Date(b.auctionEndsAt).getTime()
      );
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
    items: filteredItems,
    totalCount: filteredItems.length,
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

  const [listingRes, mediaRes, hotspotsRes, myBidRes, dealershipRes] =
    await Promise.all([
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
  const fsaPrefixes = Array.from(
    new Set(
      [
        extractFsa(dealership?.postal_code),
        extractFsa(listing.postal_code),
      ].filter((v): v is string => Boolean(v))
    )
  );

  const centroidMap = new Map<string, CentroidPoint>();
  if (fsaPrefixes.length > 0) {
    const { data: centroids, error: centroidErr } = await ctx.supabase
      .from("postal_centroids")
      .select("postal_prefix, latitude, longitude")
      .in("postal_prefix", fsaPrefixes);

    if (!centroidErr) {
      for (const c of centroids ?? []) {
        centroidMap.set(c.postal_prefix.toUpperCase(), {
          latitude: Number(c.latitude),
          longitude: Number(c.longitude),
        });
      }
    }
  }

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
    distanceKm: computeDistanceKm({
      dealerPostal: dealership?.postal_code,
      listingPostal: listing.postal_code,
      dealerCity: dealership?.city,
      dealerProvince: dealership?.province,
      listingCity: listing.city,
      listingProvince: listing.province,
      centroidMap,
    }),
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
