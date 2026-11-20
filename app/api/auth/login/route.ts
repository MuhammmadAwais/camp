import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { loginWithPassword } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const payload = await parseBody(request, loginSchema);
  const session = await loginWithPassword(payload);
  return ok(session);
});
