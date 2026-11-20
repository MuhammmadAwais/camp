import type { NextRequest } from "next/server";
import { requireKycVerified } from "@/lib/server/auth";
import { created, handleApiRoute, parseBody } from "@/lib/server/http";
import {
  createListing,
  createListingPayloadSchema,
} from "@/lib/server/services/listing.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireKycVerified();
  const payload = await parseBody(request, createListingPayloadSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const result = await createListing(ctx, payload, { ipAddress, userAgent });
  return created(result);
});
