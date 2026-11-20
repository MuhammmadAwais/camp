import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import {
  enrollTotpFactor,
  enrollTotpSchema,
} from "@/lib/server/services/mfa.service";

function extractIpAddress(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip")?.trim() || null;
}

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();

  let rawBody: unknown = {};
  const text = await request.text();
  if (text.trim().length > 0) {
    try {
      rawBody = JSON.parse(text);
    } catch {
      rawBody = {};
    }
  }

  const parsed = enrollTotpSchema.safeParse(rawBody);
  const input = parsed.success ? parsed.data : {};

  const data = await enrollTotpFactor(ctx, input, {
    ipAddress: extractIpAddress(request.headers),
  });
  return ok(data);
});
