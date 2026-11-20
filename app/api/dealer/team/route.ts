import type { NextRequest } from "next/server";
import { requireActiveDealership } from "@/lib/server/auth";
import { created, handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  inviteDealerMemberSchema,
  inviteMember,
  listTeam,
} from "@/lib/server/services/dealer-team.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireActiveDealership(["DEALER_ADMIN"]);
  const roster = await listTeam(ctx);
  return ok(roster);
});

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireActiveDealership(["DEALER_ADMIN"]);
  const payload = await parseBody(request, inviteDealerMemberSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await inviteMember(ctx, payload, { ipAddress });
  return created(result);
});
