import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { getKycStatusForUser } from "@/lib/server/services/kyc.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireAuth();
  const status = await getKycStatusForUser(ctx);
  return ok(status);
});
