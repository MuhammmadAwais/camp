"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, unwrap } from "@/lib/api-client";
import { authKeys } from "@/lib/query-keys";
import type { AuthSession, SessionUser } from "@/lib/types/auth";
import { useSessionStore } from "@/store/useSessionStore";

// Resolves to `null` when signed out. A missing in-memory token is fine: the api-client
// transparently refreshes it from the HttpOnly cookie on the first 401.
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async (): Promise<SessionUser | null> => {
      const res = await api.get<SessionUser>("/api/auth/me");
      if (!res.success && res.status === 401) return null;
      return unwrap(res);
    },
    staleTime: 60 * 1000,
  });
}

// Shared by login, verification and refresh: store the token and seed the user cache.
export function useApplySession() {
  const queryClient = useQueryClient();
  const setAccessToken = useSessionStore((s) => s.setAccessToken);

  return (session: AuthSession): void => {
    setAccessToken(session.accessToken);
    queryClient.setQueryData(authKeys.me(), session.user);
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => unwrap(await api.post<{ loggedOut: boolean }>("/api/auth/logout")),
    onSettled: () => {
      clearSession();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
