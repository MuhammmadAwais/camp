import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  presignDisputeEvidence,
  presignDisputeEvidenceSchema,
} from "@/lib/server/services/dispute.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  const payload = await parseBody(request, presignDisputeEvidenceSchema);
  const signed = await presignDisputeEvidence(ctx, payload);
  return ok(signed);
});
