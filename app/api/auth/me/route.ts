import { handleApiRoute, ok } from "@/lib/server/http";
import { getCurrentSessionUser } from "@/lib/server/services/auth.service";

export const GET = handleApiRoute(async () => {
  const user = await getCurrentSessionUser();
  return ok(user);
});
