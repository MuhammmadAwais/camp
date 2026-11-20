import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok } from "@/lib/server/http";
import { listModerationQueue } from "@/lib/server/services/moderation.service";

export const GET = handleApiRoute(async () => {
  const ctx = await requireRole(["ADMIN"]);
  const queue = await listModerationQueue(ctx);
  return ok(queue);
});
