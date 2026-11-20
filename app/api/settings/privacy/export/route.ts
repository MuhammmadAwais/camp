import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { exportPersonalData } from "@/lib/server/services/privacy.service";

function extractIpAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

/**
 * GET /api/settings/privacy/export
 * Returns a PIPEDA & Quebec Law 25 personal data JSON export archive strictly
 * scoped to the caller while preserving sealed-bid secrecy (H1 / BR-04).
 */
export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const rl = await enforceRateLimit(request, "privacy_export", {
    scopeKey: ctx.userId,
  });

  const bundle = await exportPersonalData(ctx, {
    ipAddress: extractIpAddress(request),
  });

  if (request.nextUrl.searchParams.get("download") === "1") {
    const filename = `autonexa-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
    return NextResponse.json(bundle, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        ...rateLimitHeaders(rl),
      },
    });
  }

  return ok(bundle, 200, {
    "Cache-Control": "no-store",
    ...rateLimitHeaders(rl),
  });
});
