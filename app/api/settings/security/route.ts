import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  getSecuritySettings,
  updateSecuritySchema,
  updateSecuritySettings,
} from "@/lib/server/services/settings.service";

export const GET = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const security = await getSecuritySettings(ctx, {
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  });
  return ok(security);
});

export const PATCH = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const payload = await parseBody(request, updateSecuritySchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await updateSecuritySettings(ctx, payload, { ipAddress });
  return ok(result);
});
