import { requireAuth } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody, parseQuery } from "@/lib/server/http";
import {
  clearUserNotifications,
  listNotificationsQuerySchema,
  listUserNotifications,
  markNotificationsRead,
  markNotificationsReadSchema,
} from "@/lib/server/services/notification.service";

export const GET = handleApiRoute(async (request) => {
  const ctx = await requireAuth();
  const query = parseQuery(request, listNotificationsQuerySchema);
  const data = await listUserNotifications(ctx, query);
  return ok(data);
});

export const PATCH = handleApiRoute(async (request) => {
  const ctx = await requireAuth();
  const body = await parseBody(request, markNotificationsReadSchema);
  const data = await markNotificationsRead(ctx, body);
  return ok(data);
});

export const DELETE = handleApiRoute(async () => {
  const ctx = await requireAuth();
  const data = await clearUserNotifications(ctx);
  return ok(data);
});
