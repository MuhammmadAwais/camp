import type { NextRequest } from "next/server";
import { consumeToken, db, hashPassword } from "@/lib/mock/db";
import { fail, mockApiDisabled, ok, parseJson, simulateLatency } from "@/lib/mock/http";
import { resetPasswordPayloadSchema } from "@/lib/schemas/auth-schema";

export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;
  await simulateLatency();

  const parsed = await parseJson(request, resetPasswordPayloadSchema);
  if ("response" in parsed) return parsed.response;
  const { token, password } = parsed.data;

  const user = consumeToken(db.resetTokens, token);
  if (!user) return fail(400, "RESET_TOKEN_INVALID", "This reset link is invalid or has expired. Request a new one.");

  user.passwordHash = hashPassword(password);
  db.resetTokens.delete(token);

  // Changing the password signs the user out everywhere.
  for (const [key, entry] of db.refreshTokens) if (entry.userId === user.id) db.refreshTokens.delete(key);
  for (const [key, entry] of db.accessTokens) if (entry.userId === user.id) db.accessTokens.delete(key);

  return ok({ passwordReset: true });
}
