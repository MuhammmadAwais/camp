"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { dealerKeys } from "@/lib/query-keys";
import type {
  DealerBidReceipt,
  DealerBidSubmission,
  DealerInventoryResponse,
  VehicleInspectionDetails,
} from "@/lib/types/dealer";

export function useDealerInventory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealerKeys.inventory(),
    queryFn: async (): Promise<DealerInventoryResponse> =>
      unwrap(await api.get<DealerInventoryResponse>("/api/dealer/inventory")),
    staleTime: 15 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useDealerAuctionDetail(id: string) {
  return useQuery({
    queryKey: dealerKeys.auction(id),
    queryFn: async (): Promise<VehicleInspectionDetails> =>
      unwrap(
        await api.get<VehicleInspectionDetails>(
          `/api/dealer/inventory/${encodeURIComponent(id)}`
        )
      ),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function usePlaceSealedBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: DealerBidSubmission
    ): Promise<DealerBidReceipt> =>
      unwrap(
        await api.post<DealerBidReceipt>("/api/dealer/bid", payload, {
          headers: payload.idempotencyKey
            ? { "Idempotency-Key": payload.idempotencyKey }
            : undefined,
        })
      ),
    onSuccess: (receipt) => {
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.inventory(),
      });
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.auction(receipt.auctionId),
      });
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.activeBids(),
      });
    },
  });
}
