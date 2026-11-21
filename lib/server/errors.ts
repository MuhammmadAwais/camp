export const CANONICAL_ERROR_CODES = [
  "INVALID_JSON",
  "VALIDATION_FAILED",
  "BAD_REQUEST",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "MFA_REQUIRED",
  "KYC_REQUIRED",
  "DEALERSHIP_NOT_VERIFIED",
  "NOT_FOUND",
  "CONFLICT",
  "ACTIVE_VIN_EXISTS",
  "AUCTION_NOT_ACTIVE",
  "BID_MUST_INCREASE",
  "SUBSCRIPTION_PAST_DUE",
  "QUOTA_EXCEEDED",
  "BILLING_NOT_CONFIGURED",
  "INVALID_STRIPE_SIGNATURE",
  "INVALID_UNSUBSCRIBE_TOKEN",
  "RATE_LIMITED",
  "EXTERNAL_SERVICE_ERROR",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type CanonicalErrorCode = (typeof CANONICAL_ERROR_CODES)[number];

export type ErrorCode = CanonicalErrorCode | (string & {});

export const ERROR_CODE_DEFAULT_MESSAGES: Record<
  CanonicalErrorCode,
  { en: string; fr: string }
> = {
  INVALID_JSON: {
    en: "Request body must be valid JSON.",
    fr: "Le corps de la requête doit être un JSON valide.",
  },
  VALIDATION_FAILED: {
    en: "Some fields need attention.",
    fr: "Certains champs nécessitent votre attention.",
  },
  BAD_REQUEST: {
    en: "Invalid request.",
    fr: "Requête invalide.",
  },
  UNAUTHENTICATED: {
    en: "Authentication is required.",
    fr: "L'authentification est requise.",
  },
  FORBIDDEN: {
    en: "You do not have permission to perform this action.",
    fr: "Vous n'avez pas la permission d'effectuer cette action.",
  },
  MFA_REQUIRED: {
    en: "Multi-factor authentication (AAL2) is required for this action.",
    fr: "L'authentification multifacteur (AAL2) est requise pour cette action.",
  },
  KYC_REQUIRED: {
    en: "Identity verification (KYC) is required before publishing a vehicle listing.",
    fr: "La vérification d'identité (KYC) est requise avant de publier une annonce de véhicule.",
  },
  DEALERSHIP_NOT_VERIFIED: {
    en: "Your dealership license must be verified before placing sealed bids.",
    fr: "Votre permis de concessionnaire doit être vérifié avant de soumettre des offres scellées.",
  },
  NOT_FOUND: {
    en: "Resource not found.",
    fr: "Ressource introuvable.",
  },
  CONFLICT: {
    en: "Operation conflicts with current state.",
    fr: "L'opération entre en conflit avec l'état actuel.",
  },
  ACTIVE_VIN_EXISTS: {
    en: "An active or pending listing already exists for this VIN.",
    fr: "Une annonce active ou en révision existe déjà pour ce NIV.",
  },
  AUCTION_NOT_ACTIVE: {
    en: "This auction is no longer accepting sealed bids.",
    fr: "Cette enchère n'accepte plus d'offres scellées.",
  },
  BID_MUST_INCREASE: {
    en: "Your revised sealed bid must be strictly higher than your previous bid.",
    fr: "Votre offre scellée révisée doit être strictement supérieure à votre offre précédente.",
  },
  SUBSCRIPTION_PAST_DUE: {
    en: "Active dealership subscription required.",
    fr: "Un abonnement concessionnaire actif est requis.",
  },
  QUOTA_EXCEEDED: {
    en: "Monthly dealership bidding quota has been reached.",
    fr: "Le quota mensuel d'offres du concessionnaire est atteint.",
  },
  BILLING_NOT_CONFIGURED: {
    en: "Stripe billing is not configured in this environment.",
    fr: "La facturation Stripe n'est pas configurée dans cet environnement.",
  },
  INVALID_STRIPE_SIGNATURE: {
    en: "Invalid Stripe webhook signature.",
    fr: "Signature de webhook Stripe invalide.",
  },
  INVALID_UNSUBSCRIBE_TOKEN: {
    en: "Invalid or expired unsubscribe token.",
    fr: "Jeton de désabonnement invalide ou expiré.",
  },
  RATE_LIMITED: {
    en: "Too many requests. Please try again shortly.",
    fr: "Trop de requêtes. Veuillez réessayer dans un instant.",
  },
  EXTERNAL_SERVICE_ERROR: {
    en: "Upstream service temporarily unavailable.",
    fr: "Le service externe est temporairement indisponible.",
  },
  SERVICE_UNAVAILABLE: {
    en: "Service is temporarily unavailable.",
    fr: "Le service est temporairement indisponible.",
  },
  INTERNAL_ERROR: {
    en: "An unexpected error occurred. Please try again.",
    fr: "Une erreur inattendue s'est produite. Veuillez réessayer.",
  },
};

export function getLocalizedErrorCodeMessage(
  code: ErrorCode,
  locale: "en" | "fr" = "en",
  fallbackMessage?: string
): string {
  const entry = (
    ERROR_CODE_DEFAULT_MESSAGES as Record<
      string,
      { en: string; fr: string } | undefined
    >
  )[code];
  if (!entry) {
    return fallbackMessage ?? ERROR_CODE_DEFAULT_MESSAGES.INTERNAL_ERROR[locale];
  }
  if (locale === "fr") {
    return entry.fr;
  }
  return fallbackMessage ?? entry.en;
}

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
