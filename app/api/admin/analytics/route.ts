import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  adminAnalyticsQuerySchema,
  formatAnalyticsSettlementsCsv,
  getAdminPlatformAnalytics,
} from "@/lib/server/services/admin-analytics.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["ADMIN"]);
  const query = parseQuery(request, adminAnalyticsQuerySchema);
  const analytics = await getAdminPlatformAnalytics(ctx, {
    range: query.range,
    province: query.province,
  });

  if (query.format === "csv") {
    const csv = formatAnalyticsSettlementsCsv(analytics);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="autonexa-analytics-${query.range.toLowerCase()}-${query.province.toLowerCase()}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return ok(analytics);
});
