"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, dealerKeys, sellerKeys } from "@/lib/query-keys";
import type {
  AdminDealerDecisionPayload,
  AdminDealerDecisionResult,
  AdminDealersResponse,
} from "@/lib/types/admin";

export function useAdminDealers() {
  return useQuery({
    queryKey: adminKeys.dealers(),
    queryFn: async (): Promise<AdminDealersResponse> =>
      unwrap(await api.get<AdminDealersResponse>("/api/admin/dealers")),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useDecideDealer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminDealerDecisionPayload;
    }): Promise<AdminDealerDecisionResult> =>
      unwrap(
        await api.patch<AdminDealerDecisionResult>(
          `/api/admin/dealers/${encodeURIComponent(id)}`,
          payload
        )
      ),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(adminKeys.dealer(variables.id), result.dealer);
      void queryClient.invalidateQueries({ queryKey: adminKeys.dealers() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.auctions() });
      void queryClient.invalidateQueries({ queryKey: dealerKeys.inventory() });
      void queryClient.invalidateQueries({ queryKey: dealerKeys.activeBids() });
      void queryClient.invalidateQueries({ queryKey: sellerKeys.dashboard() });
    },
  });
}
