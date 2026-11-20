"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap } from "@/lib/api-client";
import { authKeys, dealerKeys } from "@/lib/query-keys";
import type {
  DealerOnboardingApplication,
  DealerOnboardingStatusResponse,
  SubmitDealershipApplicationPayload,
} from "@/lib/types/dealer";

export type DealerOnboardingQueryResult = {
  authenticated: boolean;
  data: DealerOnboardingStatusResponse | null;
};

export type SubmitDealershipApplicationResult = {
  application: DealerOnboardingApplication;
  created: boolean;
  message: string;
};

export function useDealerOnboardingStatus() {
  return useQuery({
    queryKey: dealerKeys.onboarding(),
    queryFn: async (): Promise<DealerOnboardingQueryResult> => {
      const res = await api.get<DealerOnboardingStatusResponse>(
        "/api/dealer/register",
        { skipAuth: true }
      );
      if (!res.success && res.status === 401) {
        return { authenticated: false, data: null };
      }
      return { authenticated: true, data: unwrap(res) };
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.failure.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 15 * 1000,
  });
}

export function useSubmitDealershipApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: SubmitDealershipApplicationPayload
    ): Promise<SubmitDealershipApplicationResult> =>
      unwrap(
        await api.post<SubmitDealershipApplicationResult>(
          "/api/dealer/register",
          payload
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.onboarding(),
      });
      void queryClient.invalidateQueries({
        queryKey: authKeys.me(),
      });
    },
  });
}
