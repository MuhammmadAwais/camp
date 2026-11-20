import { NextResponse, type NextRequest } from "next/server";
import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok, parseQuery } from "@/lib/server/http";
import {
  dealerInvoicesQuerySchema,
  formatDealerInvoicesCsv,
  listDealerInvoices,
} from "@/lib/server/services/billing.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireActiveDealership(["DEALER_ADMIN"]);
  const query = parseQuery(request, dealerInvoicesQuerySchema);
  const result = await listDealerInvoices(ctx, query);

  if (query.format === "csv") {
    const csv = formatDealerInvoicesCsv(result);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="autonexa-dealer-invoices-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return ok(result);
});
