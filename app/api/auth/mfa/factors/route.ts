import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { BadRequestError } from "@/lib/server/errors";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  listUserMfaFactors,
  unenrollTotpFactor,
  unenrollTotpSchema,
} from "@/lib/server/services/mfa.service";

function extractIpAddress(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip")?.trim() || null;
}

export const GET = handleApiRoute(async () => {
  const ctx = await requireAuth();
  const data = await listUserMfaFactors(ctx);
  return ok(data);
});

export const DELETE = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const queryFactorId = request.nextUrl.searchParams.get("factorId");

  let factorId = queryFactorId?.trim() ?? "";
  if (!factorId) {
    const body = await parseBody(request, unenrollTotpSchema);
    factorId = body.factorId;
  } else {
    const parsed = unenrollTotpSchema.safeParse({ factorId });
    if (!parsed.success) {
      throw new BadRequestError("Invalid authenticator factor identifier.");
    }
    factorId = parsed.data.factorId;
  }

  const data = await unenrollTotpFactor(
    ctx,
    { factorId },
    { ipAddress: extractIpAddress(request.headers) }
  );
  return ok(data);
});
