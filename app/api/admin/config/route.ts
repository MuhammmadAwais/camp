import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  getPlatformConfig,
  updatePlatformConfig,
  updatePlatformConfigSchema,
} from "@/lib/server/services/settings.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireRole(["ADMIN"]);
  const config = await getPlatformConfig(ctx);
  return ok(config);
});

export const PATCH = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["ADMIN"]);
  const payload = await parseBody(request, updatePlatformConfigSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const updated = await updatePlatformConfig(ctx, payload, { ipAddress });
  return ok(updated);
});
