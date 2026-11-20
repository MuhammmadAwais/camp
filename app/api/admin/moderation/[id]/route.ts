import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  decideListing,
  getModerationDossier,
  moderationDecisionSchema,
} from "@/lib/server/services/moderation.service";

export const GET = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (_request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const dossier = await getModerationDossier(ctx, id);
    return ok(dossier);
  }
);

export const PATCH = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const payload = await parseBody(request, moderationDecisionSchema);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const updated = await decideListing(ctx, id, payload, { ipAddress });
    return ok(updated);
  }
);
