import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";
import { devSwitchDemoRole } from "@/lib/server/services/auth.service";

const devSwitchSchema = z.object({
  role: z
    .enum(["SELLER", "DEALER_ADMIN", "DEALER_AGENT", "ADMIN", "LOGOUT"])
    .optional(),
});

export const POST = handleApiRoute(async (request: NextRequest) => {
  const payload = await parseBody(request, devSwitchSchema);
  const result = await devSwitchDemoRole(payload.role);
  return ok(result);
});
