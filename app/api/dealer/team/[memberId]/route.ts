import type { NextRequest } from "next/server";
import {
  requireAal2ForPrivilegedRoles,
  requireActiveDealership,
} from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import {
  removeMember,
  updateDealerMemberRoleSchema,
  updateMemberRole,
} from "@/lib/server/services/dealer-team.service";

export const PATCH = handleApiRoute<{
  params: Promise<{ memberId: string }>;
}>(async (request: NextRequest, context) => {
  const ctx = await requireAal2ForPrivilegedRoles(
    await requireActiveDealership(["DEALER_ADMIN"])
  );
  const { memberId } = await context.params;
  const payload = await parseBody(request, updateDealerMemberRoleSchema);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await updateMemberRole(ctx, memberId, payload, { ipAddress });
  return ok(result);
});

export const DELETE = handleApiRoute<{
  params: Promise<{ memberId: string }>;
}>(async (request: NextRequest, context) => {
  const ctx = await requireAal2ForPrivilegedRoles(
    await requireActiveDealership(["DEALER_ADMIN"])
  );
  const { memberId } = await context.params;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await removeMember(ctx, memberId, { ipAddress });
  return ok(result);
});
