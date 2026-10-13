import { create } from "zustand";

// The short-lived access token lives in memory only (architecture.md › User Session).
// The refresh token is an HttpOnly cookie the browser sends to /api/auth/refresh.
type SessionState = {
  accessToken: string | null;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null }),
}));
