import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, type ApiFailure } from "@/lib/api-client";
import { getLocalizedErrorCodeMessage } from "@/lib/server/errors";

export function getApiFailure(error: unknown): ApiFailure | null {
  return error instanceof ApiError ? error.failure : null;
}

export function getErrorMessage(error: unknown): string {
  const failure = getApiFailure(error);
  if (failure) return failure.error;
  console.error("[ui] Unexpected error", error);
  return "Something went wrong. Please try again.";
}

export function getLocalizedErrorMessage(
  error: unknown,
  locale: "en" | "fr" = "en",
  fallback?: string
): string {
  const failure = getApiFailure(error);
  if (failure) {
    if (failure.code && locale === "fr") {
      return getLocalizedErrorCodeMessage(failure.code, "fr", failure.error);
    }
    return failure.error;
  }
  if (fallback) return fallback;
  return locale === "fr"
    ? "Une erreur inattendue s'est produite. Veuillez réessayer."
    : "Something went wrong. Please try again.";
}

// Binds API validation errors to the matching inputs (code-standards › Error Handling).
// Returns true when at least one field error was applied, so callers can skip a generic banner.
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: ReadonlyArray<Path<T>>
): boolean {
  const fieldErrors = getApiFailure(error)?.fieldErrors;
  if (!fieldErrors) return false;
  let applied = false;
  for (const field of fields) {
    const message = fieldErrors[field];
    if (message) {
      setError(field, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
