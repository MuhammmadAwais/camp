import type { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/schemas/auth-schema";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { requestPasswordReset } from "@/lib/server/services/auth.service";

// Always responds 200 so the endpoint cannot be used to enumerate accounts.
export const POST = handleApiRoute(async (request: NextRequest) => {
  const payload = await parseBody(request, forgotPasswordSchema);
  const result = await requestPasswordReset(payload.email);
  return ok(result);
});
