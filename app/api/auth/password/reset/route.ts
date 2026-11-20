import type { NextRequest } from "next/server";
import { resetPasswordPayloadSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { resetPasswordWithToken } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const payload = await parseBody(request, resetPasswordPayloadSchema);
  const result = await resetPasswordWithToken(payload.token, payload.password);
  return ok(result);
});
