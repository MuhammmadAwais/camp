"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { authKeys, settingsKeys } from "@/lib/query-keys";
import type {
  MfaEnrollPayload,
  MfaEnrollResponse,
  MfaFactorsResponse,
  MfaUnenrollPayload,
  MfaUnenrollResponse,
  MfaVerifyPayload,
  MfaVerifyResponse,
} from "@/lib/types/auth";
import { useSessionStore } from "@/store/useSessionStore";

export function useMfaFactors(enabled = true) {
  return useQuery({
    queryKey: authKeys.mfaFactors(),
    queryFn: async (): Promise<MfaFactorsResponse> =>
      unwrap(await api.get<MfaFactorsResponse>("/api/auth/mfa/factors")),
    enabled,
    staleTime: 15 * 1000,
  });
}

export function useEnrollTotp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: MfaEnrollPayload = {}
    ): Promise<MfaEnrollResponse> =>
      unwrap(await api.post<MfaEnrollResponse>("/api/auth/mfa/enroll", payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.mfaFactors() });
    },
  });
}

export function useVerifyTotp() {
  const queryClient = useQueryClient();
  const setAccessToken = useSessionStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: async (
      payload: MfaVerifyPayload
    ): Promise<MfaVerifyResponse> =>
      unwrap(await api.post<MfaVerifyResponse>("/api/auth/mfa/verify", payload)),
    onSuccess: (res) => {
      setAccessToken(res.session.accessToken);
      queryClient.setQueryData(authKeys.me(), res.session.user);
      void queryClient.invalidateQueries({ queryKey: authKeys.mfaFactors() });
      void queryClient.invalidateQueries({ queryKey: settingsKeys.security() });
      void queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
    },
  });
}

export function useUnenrollTotp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: MfaUnenrollPayload
    ): Promise<MfaUnenrollResponse> =>
      unwrap(
        await api.delete<MfaUnenrollResponse>(
          `/api/auth/mfa/factors?factorId=${encodeURIComponent(payload.factorId)}`
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.mfaFactors() });
      void queryClient.invalidateQueries({ queryKey: settingsKeys.security() });
      void queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
