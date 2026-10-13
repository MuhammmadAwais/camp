import type { NextRequest } from "next/server";
import { toSessionUser } from "@/lib/mock/db";
import { mockApiDisabled, ok, requireUser } from "@/lib/mock/http";

export async function GET(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const user = requireUser(request);
  if (user instanceof Response) return user;
  return ok(toSessionUser(user));
}
