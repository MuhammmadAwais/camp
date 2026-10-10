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
  skipAuthRefresh?: boolean;
};

const NO_REFRESH_PATHS = ["/api/auth/login", "/api/auth/refresh", "/api/auth/logout"];

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // Collapse concurrent 401s into a single refresh call.
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        useSessionStore.getState().clearSession();
        return false;
      }
      const json: unknown = await res.json();
      const token = extractAccessToken(json);
      if (!token) return false;
      useSessionStore.getState().setAccessToken(token);
      return true;
    } catch (err) {
      console.error("[api-client] Token refresh failed", err);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function extractAccessToken(json: unknown): string | null {
  if (typeof json !== "object" || json === null || !("data" in json)) return null;
  const data = (json as { data: unknown }).data;
  if (typeof data === "object" && data !== null && "accessToken" in data) {
    const token = (data as { accessToken: unknown }).accessToken;
    return typeof token === "string" ? token : null;
  }
  return null;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { body, skipAuthRefresh = false } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const send = (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
    const token = useSessionStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await send();
    const canRefresh = !skipAuthRefresh && !NO_REFRESH_PATHS.includes(path);
    if (res.status === 401 && canRefresh && (await refreshAccessToken())) {
      res = await send();
    }
  } catch (err) {
    console.error(`[api-client] ${method} ${path} network error`, err);
    return { success: false, status: 0, code: "NETWORK_ERROR", error: "We couldn't reach AutoNexa. Check your connection and try again." };
  }

  let json: unknown = null;
  try {
    json = res.status === 204 ? null : await res.json();
  } catch {
    json = null; // Non-JSON body (e.g. proxy error page) — handled as a generic failure below.
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
