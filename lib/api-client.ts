import type {
  LoginCredentials,
  RegisterSellerPayload,
  RegisterDealerPayload,
  AuthApiResponse,
  User,
  UserRole,
} from '@/types/auth';

class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Universal JSON Fetch client
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Automatically passes HTTP-only session cookies
  };

  const response = await fetch(endpoint, config);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorInfo = data.error || { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' };
    throw new ApiError(errorInfo.message, errorInfo.code, response.status, errorInfo.details);
  }

  return (data.data !== undefined ? data.data : data) as T;
}

// ========================================================
// 1. AUTHENTICATION CLIENT (BFF Proxy)
// ========================================================
export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async registerSeller(payload: RegisterSellerPayload): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'SELLER' }),
    });
  },

  async registerDealer(payload: RegisterDealerPayload): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'DEALER' }),
    });
  },

  async getSession(): Promise<{ authenticated: boolean; user: User | null }> {
    return request<{ authenticated: boolean; user: User | null }>('/api/auth/session', {
      method: 'GET',
    });
  },

  async logout(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST' });
  },

  async devSwitchRole(role: UserRole | 'LOGOUT'): Promise<{ user: User | null }> {
    return request<{ user: User | null }>('/api/auth/dev-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },
};

// ========================================================
// 2. CURRENCY & INTEGER CAD CENTS (Rule Invariant)
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

// ========================================================
// 3. API SERVICE CONTRACTS (Ready for Express Backend)
// ========================================================
export const apiClient = {
  auth: authApi,
  currency,
  // Listing, Bidding, and Dealer endpoints will plug directly here when Express backend routes are wired
};

export { ApiError };
