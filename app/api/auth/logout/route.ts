import { REFRESH_COOKIE_NAME } from "@/lib/auth-routing";
import { handleApiRoute, ok } from "@/lib/server/http";
import { logoutCurrentUser } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async () => {
  const result = await logoutCurrentUser();
  const response = ok(result);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  response.cookies.delete("autonexa_session");
  return response;
});
