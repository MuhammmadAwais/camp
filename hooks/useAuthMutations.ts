"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { authKeys } from "@/lib/query-keys";
import type { LoginPayload, RegisterPayload } from "@/lib/schemas/auth-schema";
import type {
  AuthSession,
  ForgotPasswordResponse,
  PendingVerification,
  ResendCodeResponse,
  VerificationChannel,
  VerifyContactResponse,
} from "@/lib/types/auth";

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) =>
      unwrap(await api.post<PendingVerification>("/api/auth/register", payload)),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => unwrap(await api.post<AuthSession>("/api/auth/login", payload)),
  });
}

export function usePendingVerification(registrationId: string | null) {
  return useQuery({
    queryKey: authKeys.registration(registrationId ?? ""),
    queryFn: async () =>
      unwrap(await api.get<PendingVerification>(`/api/auth/registrations/${encodeURIComponent(registrationId ?? "")}`)),
    enabled: Boolean(registrationId),
    staleTime: Infinity,
  });
}

export function useVerifyContact(channel: VerificationChannel) {
  return useMutation({
    mutationFn: async (payload: { registrationId: string; code: string }) =>
      unwrap(await api.post<VerifyContactResponse>(`/api/auth/verify/${channel}`, payload)),
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: async (payload: { registrationId: string; channel: VerificationChannel }) =>
      unwrap(await api.post<ResendCodeResponse>("/api/auth/verify/resend", payload)),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: { email: string }) =>
      unwrap(await api.post<ForgotPasswordResponse>("/api/auth/password/forgot", payload)),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) =>
      unwrap(await api.post<{ passwordReset: boolean }>("/api/auth/password/reset", payload)),
  });
}
