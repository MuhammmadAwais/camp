"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, dealerKeys, sellerKeys } from "@/lib/query-keys";
import type {
  DealerActiveBidsResponse,
  DealerWonMatchesResponse,
  LogMatchOutcomePayload,
  LogMatchOutcomeResponse,
} from "@/lib/types/dealer";

export function useDealerActiveBids() {
  return useQuery({
    queryKey: dealerKeys.activeBids(),
    queryFn: async (): Promise<DealerActiveBidsResponse> =>
      unwrap(await api.get<DealerActiveBidsResponse>("/api/dealer/active-bids")),
    staleTime: 15 * 1000,
  });
}

export function useDealerWonMatches() {
  return useQuery({
    queryKey: dealerKeys.wonMatches(),
    queryFn: async (): Promise<DealerWonMatchesResponse> =>
      unwrap(await api.get<DealerWonMatchesResponse>("/api/dealer/won-matches")),
    staleTime: 15 * 1000,
  });
}

export function useLogMatchOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      payload,
    }: {
      matchId: string;
      payload: LogMatchOutcomePayload;
    }): Promise<LogMatchOutcomeResponse> =>
      unwrap(
        await api.post<LogMatchOutcomeResponse>(
          `/api/dealer/won-matches/${encodeURIComponent(matchId)}/outcome`,
          payload
        )
      ),
    onSuccess: (result) => {
      queryClient.setQueryData<DealerWonMatchesResponse>(
        dealerKeys.wonMatches(),
        (prev) => {
          if (!prev) return prev;
          const nextItems = prev.items.map((item) =>
            item.id === result.match.id ? result.match : item
          );
          const completedItems = nextItems.filter(
            (m) => m.status === "COMPLETED" || m.status === "RENEGOTIATED_LOWER"
          );
          return {
            ...prev,
            items: nextItems,
            summary: {
              totalWonValueCents: nextItems.reduce(
                (sum, m) => sum + m.acceptedBidAmountCents,
                0
              ),
              totalWonCount: nextItems.length,
              scheduledCount: nextItems.filter(
                (m) => m.status === "APPOINTMENT_CONFIRMED"
              ).length,
              completedCount: completedItems.length,
              totalSettledValueCents: completedItems.reduce(
                (sum, m) =>
                  sum + (m.finalTransactionCents ?? m.acceptedBidAmountCents),
                0
              ),
            },
            serverTime: result.serverTime,
          };
        }
      );

      void queryClient.invalidateQueries({
        queryKey: dealerKeys.wonMatches(),
      });
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.activeBids(),
      });
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.dashboard(),
      });
      void queryClient.invalidateQueries({
        queryKey: adminKeys.auctions(),
      });
    },
  });
}
