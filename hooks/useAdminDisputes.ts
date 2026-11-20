"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, dealerKeys, sellerKeys } from "@/lib/query-keys";
import type {
  AdminDisputesResponse,
  DisputeItem,
  OpenDisputePayload,
  ResolveDisputePayload,
  ResolveDisputeResult,
} from "@/lib/types/admin";

export function useAdminDisputes() {
  return useQuery({
    queryKey: adminKeys.disputes(),
    queryFn: async (): Promise<AdminDisputesResponse> =>
      unwrap(await api.get<AdminDisputesResponse>("/api/admin/disputes")),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useAdminDisputeDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.dispute(id),
    queryFn: async (): Promise<DisputeItem> =>
      unwrap(
        await api.get<DisputeItem>(
          `/api/admin/disputes/${encodeURIComponent(id)}`
        )
      ),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function useResolveDispute(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: ResolveDisputePayload
    ): Promise<ResolveDisputeResult> =>
      unwrap(
        await api.patch<ResolveDisputeResult>(
          `/api/admin/disputes/${encodeURIComponent(id)}`,
          payload
        )
      ),
    onSuccess: (result) => {
      queryClient.setQueryData(adminKeys.dispute(id), result.dispute);
      void queryClient.invalidateQueries({ queryKey: adminKeys.disputes() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.auctions() });
      void queryClient.invalidateQueries({ queryKey: dealerKeys.wonMatches() });
      void queryClient.invalidateQueries({ queryKey: sellerKeys.dashboard() });
    },
  });
}

export function useOpenDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OpenDisputePayload): Promise<DisputeItem> =>
      unwrap(await api.post<DisputeItem>("/api/disputes", payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.disputes() });
      void queryClient.invalidateQueries({ queryKey: dealerKeys.wonMatches() });
    },
  });
}
