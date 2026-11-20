import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import { ExternalServiceError, ForbiddenError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  AdminAnalyticsResponse,
  AnalyticsTimeRange,
  LeaderboardDealer,
  MetroVelocityBar,
  ProvincialMarketShare,
  WholesaleSettlementRecord,
} from "@/lib/types/admin";

const emptyToUndefined = (val: unknown): unknown =>
  val === "" || val === null || val === undefined ? undefined : val;

export const adminAnalyticsQuerySchema = z.object({
  range: z.preprocess(
    (val) =>
      emptyToUndefined(val) === undefined
        ? "30D"
        : String(val).trim().toUpperCase(),
    z.enum(["7D", "30D", "90D", "YTD"]).default("30D")
  ),
  province: z.preprocess(
    (val) =>
      emptyToUndefined(val) === undefined
        ? "ALL"
        : String(val).trim().toUpperCase(),
    z
      .string()
      .refine(
        (val) => val === "ALL" || /^[A-Z]{2}$/.test(val),
        "Province must be ALL or a 2-letter Canadian jurisdiction code."
      )
      .default("ALL")
  ),
  format: z.preprocess(
    (val) =>
      emptyToUndefined(val) === undefined
        ? "json"
        : String(val).trim().toLowerCase(),
    z.enum(["json", "csv"]).default("json")
  ),
});

export type AdminAnalyticsQuery = z.output<typeof adminAnalyticsQuerySchema>;

const analyticsRpcSchema = z.object({
  range: z.enum(["7D", "30D", "90D", "YTD"]),
  province: z.string(),
  kpis: z.object({
    totalVolumeCents: z.coerce.number().int().nonnegative(),
    previousVolumeCents: z.coerce.number().int().nonnegative(),
    gmvGrowthPercent: z.coerce.number(),
    totalTransactionsCount: z.coerce.number().int().nonnegative(),
    totalListingsCount: z.coerce.number().int().nonnegative(),
    eligibleClosedListingsCount: z.coerce.number().int().nonnegative(),
    clearedLotsCount: z.coerce.number().int().nonnegative(),
    clearanceRatePercent: z.coerce.number(),
    averageBidsPerLot: z.coerce.number(),
    averageSellerSurplusCents: z.coerce.number().int().nonnegative(),
    activeDealerCount: z.coerce.number().int().nonnegative(),
    activeAuctionsCount: z.coerce.number().int().nonnegative(),
    totalBidsCount: z.coerce.number().int().nonnegative(),
  }),
  trend: z.array(
    z.object({
      bucketStart: z.string(),
      day: z.string(),
      dateStr: z.string(),
      volumeCents: z.coerce.number().int().nonnegative(),
      reserveFloorCents: z.coerce.number().int().nonnegative(),
      bidsCount: z.coerce.number().int().nonnegative(),
      lotsCleared: z.coerce.number().int().nonnegative(),
    })
  ),
  provincialShare: z.array(
    z.object({
      province: z.string(),
      code: z.string(),
      regulator: z.string(),
      volumeCents: z.coerce.number().int().nonnegative(),
      sharePercent: z.coerce.number(),
      dealersCount: z.coerce.number().int().nonnegative(),
      lotsCount: z.coerce.number().int().nonnegative(),
      clearedLotsCount: z.coerce.number().int().nonnegative(),
      avgSurplusCents: z.coerce.number().int().nonnegative(),
    })
  ),
  metroVelocity: z.array(
    z.object({
      city: z.string(),
      provinceCode: z.string(),
      intakeLots: z.coerce.number().int().nonnegative(),
      clearedLots: z.coerce.number().int().nonnegative(),
      clearancePercent: z.coerce.number(),
    })
  ),
  dealerLeaderboard: z.array(
    z.object({
      rank: z.coerce.number().int().positive(),
      dealershipId: z.string(),
      name: z.string(),
      entity: z.string(),
      regulator: z.string(),
      licenseNumber: z.string(),
      province: z.string(),
      lotsWon: z.coerce.number().int().nonnegative(),
      bidsPlaced: z.coerce.number().int().nonnegative(),
      volumeCents: z.coerce.number().int().nonnegative(),
      growthPercent: z.coerce.number(),
      monogram: z.string(),
    })
  ),
  settlements: z.array(
    z.object({
      id: z.string(),
      listingId: z.string(),
      voucherCode: z.string(),
      vehicle: z.string(),
      vin: z.string(),
      buyer: z.string(),
      regulator: z.string(),
      province: z.string(),
      amountCents: z.coerce.number().int().nonnegative(),
      surplusCents: z.coerce.number().int().nonnegative(),
      completedAtIso: z.string(),
      status: z.enum(["SETTLED", "ESCROW_CLEARED"]),
      outcome: z.string(),
    })
  ),
});

export function sanitizeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const escaped = formulaSafe.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Fetches live platform GMV, clearance rates, regional market share,
 * metro hub velocity, dealership rankings, and settlement ledger entries.
 */
export async function getAdminPlatformAnalytics(
  ctx: SessionContext,
  query: Pick<AdminAnalyticsQuery, "range" | "province">
): Promise<AdminAnalyticsResponse> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can access marketplace analytics."
    );
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("get_admin_platform_analytics", {
    p_range: query.range,
    p_province: query.province,
  });

  if (error || !data) {
    logger.error("Failed to fetch admin platform analytics RPC", {
      route: "GET /api/admin/analytics",
      actorId: ctx.userId,
      meta: { error },
    });
    throw new ExternalServiceError(
      "Unable to load platform analytics from database.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const parsed = analyticsRpcSchema.safeParse(data);
  if (!parsed.success) {
    logger.error("Admin platform analytics RPC shape mismatch", {
      route: "GET /api/admin/analytics",
      actorId: ctx.userId,
      meta: { issues: parsed.error.issues },
    });
    throw new ExternalServiceError(
      "Platform analytics returned an unexpected payload structure.",
      "EXTERNAL_SERVICE_ERROR"
    );
  }

  const payload = parsed.data;
  const provincialShare: ProvincialMarketShare[] = payload.provincialShare;
  const metroVelocity: MetroVelocityBar[] = payload.metroVelocity;
  const dealerLeaderboard: LeaderboardDealer[] = payload.dealerLeaderboard;
  const settlements: WholesaleSettlementRecord[] = payload.settlements;

  return {
    range: payload.range as AnalyticsTimeRange,
    province: payload.province,
    kpis: payload.kpis,
    trend: payload.trend,
    provincialShare,
    metroVelocity,
    dealerLeaderboard,
    settlements,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Serializes wholesale settlements and summary KPI metadata into an RFC 4180
 * formula-injection-safe UTF-8 CSV report.
 */
export function formatAnalyticsSettlementsCsv(
  data: AdminAnalyticsResponse
): string {
  const headers = [
    "voucher_code",
    "listing_id",
    "vehicle",
    "vin",
    "buyer",
    "regulator",
    "province",
    "settlement_amount_cents",
    "settlement_amount_cad",
    "surplus_cents",
    "surplus_cad",
    "status",
    "outcome",
    "completed_at_utc",
    "report_range",
  ];

  const rows = data.settlements.map((row) =>
    [
      row.voucherCode,
      row.listingId,
      row.vehicle,
      row.vin,
      row.buyer,
      row.regulator,
      row.province,
      row.amountCents,
      (row.amountCents / 100).toFixed(2),
      row.surplusCents,
      (row.surplusCents / 100).toFixed(2),
      row.status,
      row.outcome,
      row.completedAtIso,
      data.range,
    ]
      .map(sanitizeCsvCell)
      .join(",")
  );

  return [headers.map(sanitizeCsvCell).join(","), ...rows].join("\r\n");
}
