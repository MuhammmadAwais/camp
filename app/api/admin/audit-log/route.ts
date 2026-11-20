import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  adminAuditLogQuerySchema,
  exportAdminAuditLogsCsv,
  listAdminAuditLogs,
} from "@/lib/server/services/admin-audit.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["ADMIN"]);
  const query = parseQuery(request, adminAuditLogQuerySchema);

  if (query.format === "csv") {
    const csv = await exportAdminAuditLogsCsv(ctx, query);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="autonexa-audit-log-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await listAdminAuditLogs(ctx, query);
  return ok(result);
});
