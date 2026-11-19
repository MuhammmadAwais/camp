import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  BadRequestError,
  RateLimitError,
  ValidationError,
  isAppError,
  type ErrorCode,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";

export type RouteMeta = {
  requestId: string;
};

type FailOptions = {
  fields?: Record<string, string>;
  details?: Record<string, unknown>;
  requestId?: string;
  headers?: HeadersInit;
};

function mapZodIssuesToFields(issues: readonly z.ZodIssue[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

/**
 * Standard success JSON envelope (`{ data }`) matching `lib/api-client.ts`.
 */
export function ok<T>(data: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ data }, { status, headers });
}

/**
 * Standard 201 Created JSON envelope (`{ data }`).
 */
export function created<T>(data: T, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ data }, { status: 201, headers });
}

/**
 * Standard failure JSON envelope (`{ error: { code, message, fields?, details?, requestId? } }`).
 */
export function fail(
  status: number,
  code: ErrorCode,
  message: string,
  options: FailOptions = {}
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(options.fields && Object.keys(options.fields).length > 0
          ? { fields: options.fields }
          : {}),
        ...(options.details ? { details: options.details } : {}),
        ...(options.requestId ? { requestId: options.requestId } : {}),
      },
    },
    { status, headers: options.headers }
  );
}

/**
 * Parses and validates JSON request body against a Zod schema.
 * Throws `BadRequestError` on malformed JSON or `ValidationError` on schema failure.
 */
export async function parseBody<S extends z.ZodType>(
  request: NextRequest,
  schema: S
): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.", "INVALID_JSON");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      "Some fields need attention.",
      mapZodIssuesToFields(parsed.error.issues)
    );
  }

  return parsed.data;
}

/**
 * Parses and validates URL search query parameters against a Zod schema.
 * Throws `ValidationError` on schema failure.
 */
export function parseQuery<S extends z.ZodType>(
  request: NextRequest,
  schema: S
): z.output<S> {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid query parameters.",
      mapZodIssuesToFields(parsed.error.issues)
    );
  }
  return parsed.data;
}

/**
 * Wraps Next.js Route Handlers with centralized request tracing, structured error
 * logging, and strict error envelope guarantees so no unhandled exceptions or raw DB errors leak.
 */
export function handleApiRoute<TContext = unknown>(
  handler: (
    request: NextRequest,
    context: TContext,
    meta: RouteMeta
  ) => Promise<NextResponse>
): (request: NextRequest, context: TContext) => Promise<NextResponse> {
  return async (request: NextRequest, context: TContext): Promise<NextResponse> => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    const route = `${request.method} ${request.nextUrl.pathname}`;
    const startedAt = Date.now();

    try {
      const response = await handler(request, context, { requestId });
      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (error: unknown) {
      const durationMs = Date.now() - startedAt;

      if (isAppError(error)) {
        const logFn = error.status >= 500 ? logger.error : logger.warn;
        logFn(error.message, {
          requestId,
          route,
          durationMs,
          meta: {
            code: error.code,
            status: error.status,
            ...(error.cause ? { cause: error.cause } : {}),
          },
        });

        const headers = new Headers({ "X-Request-Id": requestId });
        if (error instanceof RateLimitError && error.retryAfterSeconds !== undefined) {
          headers.set("Retry-After", String(error.retryAfterSeconds));
        }

        return fail(error.status, error.code, error.message, {
          fields: error.fields,
          details: error.details,
          requestId,
          headers,
        });
      }

      if (error instanceof z.ZodError) {
        logger.warn("Request validation failed", {
          requestId,
          route,
          durationMs,
          meta: { issueCount: error.issues.length },
        });
        const response = fail(422, "VALIDATION_FAILED", "Some fields need attention.", {
          fields: mapZodIssuesToFields(error.issues),
          requestId,
        });
        response.headers.set("X-Request-Id", requestId);
        return response;
      }

      logger.error("Unhandled API route error", {
        requestId,
        route,
        durationMs,
        meta: { error },
      });

      const response = fail(
        500,
        "INTERNAL_ERROR",
        "An unexpected error occurred. Please try again.",
        { requestId }
      );
      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}
