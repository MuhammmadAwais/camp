import type { NextRequest } from "next/server";
import { registerPayloadSchema } from "@/lib/schemas/auth-schema";
import { created, handleApiRoute, parseBody } from "@/lib/server/http";
import { registerAccount } from "@/lib/server/services/auth.service";

export const POST = handleApiRoute(async (request: NextRequest) => {
  const payload = await parseBody(request, registerPayloadSchema);
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const pending = await registerAccount(payload, { ipAddress, userAgent });
  return created(pending);
});
