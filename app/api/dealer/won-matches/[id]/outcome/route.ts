import type { NextRequest } from "next/server";
import { requireActiveDealership } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  logMatchOutcome,
  logMatchOutcomeSchema,
} from "@/lib/server/services/dealer-matches.service";

export const POST = handleApiRoute<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, context) => {
    const ctx = await requireActiveDealership();
    const { id } = await context.params;
    const payload = await parseBody(request, logMatchOutcomeSchema);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const result = await logMatchOutcome(ctx, id, payload, { ipAddress });
    return ok(result);
  }
);
