export type ErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_FAILED"
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "MFA_REQUIRED"
  | "KYC_REQUIRED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "ACTIVE_VIN_EXISTS"
  | "AUCTION_NOT_ACTIVE"
  | "BID_MUST_INCREASE"
  | "SUBSCRIPTION_PAST_DUE"
  | "QUOTA_EXCEEDED"
  | "BILLING_NOT_CONFIGURED"
  | "INVALID_STRIPE_SIGNATURE"
  | "INVALID_UNSUBSCRIBE_TOKEN"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | (string & {});

export type AppErrorOptions = {
  status: number;
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
  details?: Record<string, unknown>;
  cause?: unknown;
};

/**
 * Operational domain/HTTP error carrying a stable machine-readable code
 * mapped directly onto the `{ error: { code, message, fields?, details?, requestId } }` envelope.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;
  readonly details?: Record<string, unknown>;
  readonly isOperational = true;
  override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = new.target.name;
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
    this.details = options.details;
    this.cause = options.cause;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Some fields need attention.",
    fields?: Record<string, string>,
    details?: Record<string, unknown>
  ) {
    super({ status: 422, code: "VALIDATION_FAILED", message, fields, details });
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = "Invalid request.",
    code: ErrorCode = "BAD_REQUEST",
    details?: Record<string, unknown>
  ) {
    super({ status: 400, code, message, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication is required.",
    code: ErrorCode = "UNAUTHENTICATED"
  ) {
    super({ status: 401, code, message });
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to perform this action.",
    code: ErrorCode = "FORBIDDEN",
    details?: Record<string, unknown>
  ) {
    super({ status: 403, code, message, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.", code: ErrorCode = "NOT_FOUND") {
    super({ status: 404, code, message });
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "Operation conflicts with current state.",
    code: ErrorCode = "CONFLICT",
    details?: Record<string, unknown>
  ) {
    super({ status: 409, code, message, details });
  }
}

export class PaymentRequiredError extends AppError {
  constructor(
    message = "Active dealership subscription required.",
    code: ErrorCode = "SUBSCRIPTION_PAST_DUE",
    details?: Record<string, unknown>
  ) {
    super({ status: 402, code, message, details });
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds?: number;

  constructor(
    message = "Too many requests. Please try again shortly.",
    retryAfterSeconds?: number,
    code: ErrorCode = "RATE_LIMITED"
  ) {
    super({
      status: 429,
      code,
      message,
      details: retryAfterSeconds !== undefined ? { retryAfterSeconds } : undefined,
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    message = "Upstream service temporarily unavailable.",
    code: ErrorCode = "EXTERNAL_SERVICE_ERROR",
    cause?: unknown
  ) {
    super({ status: 502, code, message, cause });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
