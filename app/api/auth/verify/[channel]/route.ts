import type { NextRequest } from "next/server";
import { verifyPayloadSchema } from "@/lib/schemas/auth-schema";
import { NotFoundError } from "@/lib/server/errors";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import { verifyContactChannel } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute<{ params: Promise<{ channel: string }> }>(
  async (request: NextRequest, context) => {
    const { channel } = await context.params;
    if (channel !== "email" && channel !== "phone") {
      throw new NotFoundError("Unknown verification channel.");
    }

    const rl = await enforceRateLimit(request, "auth_verify");
    const payload = await parseBody(request, verifyPayloadSchema);
    const result = await verifyContactChannel(
      payload.registrationId,
      channel,
      payload.code
    );
    return ok(result, 200, rateLimitHeaders(rl));
  }
);
