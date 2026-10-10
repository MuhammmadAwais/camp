"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { authKeys, kycKeys } from "@/lib/query-keys";
import type { IdDocumentType, KycStatusResponse, SessionUser } from "@/lib/types/auth";

export type KycSubmission = {
  idDocType: IdDocumentType;
  idFront: File;
  idBack: File | null;
  selfie: File;
};

// While a submission is PENDING the provider decides asynchronously, so the status is re-checked
// every few seconds. (Real backend: KYC webhook → push notification; this check is the fallback.)
export function useKycStatus() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: kycKeys.status(),
    queryFn: async (): Promise<KycStatusResponse> => {
      const status = unwrap(await api.get<KycStatusResponse>("/api/kyc/status"));
      queryClient.setQueryData<SessionUser | null>(authKeys.me(), (user) =>
        user ? { ...user, kycStatus: status.status } : user
      );
      return status;
    },
    staleTime: 5 * 1000,
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 3000 : false),
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: KycSubmission) => {
      const form = new FormData();
      form.append("idDocType", submission.idDocType);
      form.append("idFront", submission.idFront);
      if (submission.idBack) form.append("idBack", submission.idBack);
      form.append("selfie", submission.selfie);
      form.append("consent", "true");
      return unwrap(await api.post<KycStatusResponse>("/api/kyc/submissions", form));
    },
    onSuccess: (status) => {
      queryClient.setQueryData(kycKeys.status(), status);
      queryClient.setQueryData<SessionUser | null>(authKeys.me(), (user) =>
        user ? { ...user, kycStatus: status.status } : user
      );
    },
  });
}
