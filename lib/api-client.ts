import { useSessionStore } from "@/store/useSessionStore";

// When NEXT_PUBLIC_API_URL is unset, requests go to the mock route handlers in app/api.
// Set it to the Express origin to switch every hook to the real backend.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const IS_MOCK_API = API_BASE_URL === "";

export type ApiFieldErrors = Record<string, string>;

export type ApiSuccess<T> = { success: true; data: T };

export type ApiFailure = {
  success: false;
  status: number;
  code: string;
  error: string;
  fieldErrors?: ApiFieldErrors;
  details?: Record<string, unknown>;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

// Wire format shared with the Express API: `{ data }` on success, `{ error }` otherwise.
type WireError = {
  code?: string;
  message?: string;
  fields?: ApiFieldErrors;
  details?: Record<string, unknown>;
};

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        useSessionStore.getState().clearSession();
        return null;
      }
      const json = await res.json().catch(() => null);
      const token = json?.data?.accessToken as string | undefined;
      if (token) {
        useSessionStore.getState().setAccessToken(token);
        return token;
      }
      useSessionStore.getState().clearSession();
      return null;
    } catch {
      useSessionStore.getState().clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = useSessionStore.getState().accessToken;
  if (token && !options.skipAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: hasBody ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
  };

  let res = await fetch(url, init);

  // If unauthorized and we had a token, attempt one transparent refresh then retry.
  if (res.status === 401 && token && !options.skipAuth) {
    const freshToken = await refreshAccessToken();
    if (freshToken) {
      headers["Authorization"] = `Bearer ${freshToken}`;
      res = await fetch(url, { ...init, headers });
    }
  }

  let json: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    json = await res.json().catch(() => null);
  }

  if (res.ok) {
    const data = typeof json === "object" && json !== null && "data" in json ? (json as { data: T }).data : (null as T);
    return { success: true, data };
  }

  const wire: WireError =
    typeof json === "object" && json !== null && "error" in json ? ((json as { error: WireError }).error ?? {}) : {};

  return {
    success: false,
    status: res.status,
    code: wire.code ?? "UNKNOWN_ERROR",
    error: wire.message ?? "Something went wrong. Please try again.",
    fieldErrors: wire.fields,
    details: wire.details,
  };
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

// Thrown from mutation/query functions so TanStack surfaces the full failure to the UI.
export class ApiError extends Error {
  readonly failure: ApiFailure;

  constructor(failure: ApiFailure) {
    super(failure.error);
    this.name = "ApiError";
    this.failure = failure;
  }
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.success) throw new ApiError(result);
  return result.data;
}

// ========================================================
// CURRENCY & INTEGER CAD CENTS (Rule Invariant)
// ========================================================
export const currency = {
  /**
   * Formats integer CAD cents to a localized currency string
   * Example: 2450000 -> "$24,500 CAD"
   */
  formatCad(cents: number, includeCode = true): string {
    const dollars = cents / 100;
    const formatted = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(dollars);
    return includeCode ? `${formatted} CAD` : formatted;
  },

  /**
   * Converts standard dollar number or string to integer cents
   * Example: 24500 -> 2450000
   */
  dollarsToCents(dollars: number | string): number {
    const numeric = typeof dollars === 'string' ? parseFloat(dollars.replace(/[^0-9.-]+/g, '')) : dollars;
    return Math.round((numeric || 0) * 100);
  },

  /**
   * Converts integer cents to float dollars for display inputs
   */
  centsToDollars(cents: number): number {
    return cents / 100;
  },
};

export const apiClient = {
  api,
  currency,
};
