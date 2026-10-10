import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { REFRESH_COOKIE_NAME } from "@/lib/auth-routing";
import { REFRESH_TOKEN_TTL_MS, consumeToken, db, issueSessionTokens, toSessionUser, type MockUser } from "@/lib/mock/db";
import type { AuthSession } from "@/lib/types/auth";

// Mock routes are on in development, and in other environments only with ENABLE_MOCK_API=true
// (e.g. a staging demo). They must never answer in production by accident.
export function mockApiDisabled(): NextResponse | null {
  const enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_MOCK_API === "true";
  return enabled ? null : fail(404, "NOT_FOUND", "Not found");
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, code: string, message: string, fields?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export function failWithDetails(status: number, code: string, message: string, details: object): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

// Small artificial latency so loading states are visible during development.
export function simulateLatency(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function parseJson<S extends z.ZodType>(
  request: NextRequest,
  schema: S
): Promise<{ data: z.output<S> } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: fail(400, "INVALID_JSON", "Request body must be JSON") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fields[key]) fields[key] = issue.message;
    }
    return { response: fail(422, "VALIDATION_FAILED", "Some fields need attention", fields) };
  }
  return { data: parsed.data };
}

export function requireUser(request: NextRequest): MockUser | NextResponse {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = consumeToken(db.accessTokens, token);
  return user ?? fail(401, "UNAUTHENTICATED", "Your session has expired. Please sign in again.");
}

export function createSession(user: MockUser): { session: AuthSession; refreshToken: string } {
  const { accessToken, refreshToken } = issueSessionTokens(user.id);
  return { session: { accessToken, user: toSessionUser(user) }, refreshToken };
}

export function sessionResponse(user: MockUser, status = 200): NextResponse {
  const { session, refreshToken } = createSession(user);
  return withRefreshCookie(ok(session, status), refreshToken);
}

export function withRefreshCookie(res: NextResponse, refreshToken: string): NextResponse {
  res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(REFRESH_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
