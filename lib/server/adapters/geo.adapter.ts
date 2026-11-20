import {
  normalizePostalCode,
  type ProvinceCode,
  suggestProvinceFromPostal,
} from "@/lib/canada";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type GeoResolution = {
  postalCode: string;
  fsaPrefix: string;
  city: string;
  province: ProvinceCode;
  latitude: number;
  longitude: number;
  locationWkt: string;
  source: "postal_centroid" | "province_centroid" | "fallback";
};

type ProvincialFallback = {
  fsaPrefix: string;
  city: string;
  latitude: number;
  longitude: number;
};

const PROVINCE_CAPITAL_CENTROIDS: Record<ProvinceCode, ProvincialFallback> = {
  ON: { fsaPrefix: "M5V", city: "Toronto", latitude: 43.6426, longitude: -79.3871 },
  QC: { fsaPrefix: "H3A", city: "Montreal", latitude: 45.5017, longitude: -73.5673 },
  BC: { fsaPrefix: "V6B", city: "Vancouver", latitude: 49.2827, longitude: -123.1207 },
  AB: { fsaPrefix: "T2P", city: "Calgary", latitude: 51.0447, longitude: -114.0719 },
  MB: { fsaPrefix: "R3C", city: "Winnipeg", latitude: 49.8951, longitude: -97.1384 },
  SK: { fsaPrefix: "S4P", city: "Regina", latitude: 50.4452, longitude: -104.6189 },
  NS: { fsaPrefix: "B3J", city: "Halifax", latitude: 44.6488, longitude: -63.5752 },
  NB: { fsaPrefix: "E1C", city: "Moncton", latitude: 46.0878, longitude: -64.7782 },
  NL: { fsaPrefix: "A1C", city: "St. John's", latitude: 47.5615, longitude: -52.7126 },
  PE: { fsaPrefix: "C1A", city: "Charlottetown", latitude: 46.2382, longitude: -63.1311 },
  NT: { fsaPrefix: "X1A", city: "Yellowknife", latitude: 62.454, longitude: -114.3718 },
  YT: { fsaPrefix: "Y1A", city: "Whitehorse", latitude: 60.7212, longitude: -135.0568 },
  NU: { fsaPrefix: "X0A", city: "Iqaluit", latitude: 63.7467, longitude: -68.517 },
};

function isProvinceCode(raw?: string | null): raw is ProvinceCode {
  if (!raw) return false;
  return Object.prototype.hasOwnProperty.call(
    PROVINCE_CAPITAL_CENTROIDS,
    raw.trim().toUpperCase()
  );
}

function normalizeProvince(
  preferred?: string | null,
  postalCode?: string
): ProvinceCode {
  if (isProvinceCode(preferred)) {
    return preferred.trim().toUpperCase() as ProvinceCode;
  }
  const suggested = postalCode ? suggestProvinceFromPostal(postalCode) : null;
  if (suggested) return suggested;
  return "ON";
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats WGS84 coordinates into a PostGIS EWKT geography/geometry point string.
 */
export function formatPointWkt(latitude: number, longitude: number): string {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}

/**
 * Lightweight fallback distance calculation when PostGIS geometry is unavailable.
 */
export function haversineFallbackKm(
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

/**
 * Resolves a Canadian postal code to PostGIS-ready WGS84 coordinates (`locationWkt`)
 * using seeded `public.postal_centroids` FSA lookup with provincial centroid fallback.
 */
export async function geocodeCanadianPostalCode(
  rawPostalCode: string,
  options?: {
    preferredProvince?: string | null;
    preferredCity?: string | null;
  }
): Promise<GeoResolution> {
  // TODO(senior-review): Upgrade to Google Geocoding API (GOOGLE_MAPS_API_KEY) for street-level rooftop coordinates in production, caching resolved points in public.postal_centroids.
  const postalCode = normalizePostalCode(rawPostalCode || "M5V 2T6") || "M5V 2T6";
  const compact = postalCode.replace(/\s+/g, "").toUpperCase();
  const fsaPrefix = compact.slice(0, 3);
  const resolvedProvince = normalizeProvince(
    options?.preferredProvince,
    postalCode
  );
  const fallbackCapital = PROVINCE_CAPITAL_CENTROIDS[resolvedProvince];

  const admin = createAdminSupabaseClient();

  if (fsaPrefix.length === 3) {
    const { data: exact } = await admin
      .from("postal_centroids")
      .select("postal_prefix, city, province, latitude, longitude")
      .eq("postal_prefix", fsaPrefix)
      .maybeSingle();

    if (exact) {
      const latitude = Number(exact.latitude);
      const longitude = Number(exact.longitude);
      const province = normalizeProvince(
        exact.province,
        postalCode
      );
      return {
        postalCode,
        fsaPrefix: exact.postal_prefix,
        city: options?.preferredCity?.trim() || exact.city,
        province,
        latitude,
        longitude,
        locationWkt: formatPointWkt(latitude, longitude),
        source: "postal_centroid",
      };
    }
  }

  const { data: provRow } = await admin
    .from("postal_centroids")
    .select("postal_prefix, city, province, latitude, longitude")
    .eq("postal_prefix", fallbackCapital.fsaPrefix)
    .maybeSingle();

  if (provRow) {
    const latitude = Number(provRow.latitude);
    const longitude = Number(provRow.longitude);
    return {
      postalCode,
      fsaPrefix: fsaPrefix.length === 3 ? fsaPrefix : provRow.postal_prefix,
      city: options?.preferredCity?.trim() || provRow.city,
      province: resolvedProvince,
      latitude,
      longitude,
      locationWkt: formatPointWkt(latitude, longitude),
      source: "province_centroid",
    };
  }

  return {
    postalCode,
    fsaPrefix:
      fsaPrefix.length === 3 ? fsaPrefix : fallbackCapital.fsaPrefix,
    city: options?.preferredCity?.trim() || fallbackCapital.city,
    province: resolvedProvince,
    latitude: fallbackCapital.latitude,
    longitude: fallbackCapital.longitude,
    locationWkt: formatPointWkt(
      fallbackCapital.latitude,
      fallbackCapital.longitude
    ),
    source: "fallback",
  };
}
