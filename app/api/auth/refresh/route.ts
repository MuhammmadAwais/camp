import { handleApiRoute, ok } from "@/lib/server/http";
import { refreshCurrentSession } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async () => {
  const session = await refreshCurrentSession();
  return ok(session);
});
