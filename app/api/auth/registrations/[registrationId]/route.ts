import type { NextRequest } from "next/server";
import { handleApiRoute, ok } from "@/lib/server/http";
import { getPendingVerification } from "@/lib/server/services/auth.service";

export const GET = handleApiRoute<{ params: Promise<{ registrationId: string }> }>(
  async (_request: NextRequest, context) => {
    const { registrationId } = await context.params;
    const pending = await getPendingVerification(registrationId);
    return ok(pending);
  }
);
