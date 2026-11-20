import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  getProfileSettings,
  updateProfileSchema,
  updateProfileSettings,
} from "@/lib/server/services/settings.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireAuth();
  const profile = await getProfileSettings(ctx);
  return ok(profile);
});

export const PATCH = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const payload = await parseBody(request, updateProfileSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const updated = await updateProfileSettings(ctx, payload, {
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  });
  return ok(updated);
});
