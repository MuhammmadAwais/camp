import { handleApiRoute, ok } from "@/lib/server/http";
import { getSessionSnapshot } from "@/lib/server/services/auth.service";

export const GET = handleApiRoute(async () => {
  const snapshot = await getSessionSnapshot();
  return ok(snapshot);
});
