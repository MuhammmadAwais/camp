import { create } from "zustand";

// Authoritative session transport uses same-site @supabase/ssr HttpOnly cookies
// refreshed by proxy.ts. This lightweight client state mirrors session presence only.
type SessionState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null }),
}));
