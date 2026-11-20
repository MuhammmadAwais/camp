"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, dealerKeys, sellerKeys } from "@/lib/query-keys";
import type {
  AdminAuctionLot,
  AdminAuctionOverridePayload,
  AdminAuctionOverrideResult,
  AdminAuctionsResponse,
} from "@/lib/types/admin";

function recomputeSummary(items: AdminAuctionLot[], nowMs: number) {
  return {
    activeCount: items.filter((l) => l.status === "ACTIVE").length,
    urgentCount: items.filter((l) => {
      if (l.status !== "ACTIVE") return false;
      const diff = Date.parse(l.endsAt) - nowMs;
      return Number.isFinite(diff) && diff > 0 && diff < 60 * 60 * 1000;
    }).length,
    unsealedCount: items.filter((l) => l.status === "UNSEALED").length,
    acceptedCount: items.filter(
      (l) => l.status === "ACCEPTED" || l.status === "COMPLETED"
    ).length,
    totalCount: items.length,
  };
}

export function useAdminAuctions() {
  return useQuery({
    queryKey: adminKeys.auctions(),
    queryFn: async (): Promise<AdminAuctionsResponse> =>
      unwrap(await api.get<AdminAuctionsResponse>("/api/admin/auctions")),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useAdminAuctionOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      payload,
    }: {
      listingId: string;
      payload: AdminAuctionOverridePayload;
    }): Promise<AdminAuctionOverrideResult> =>
      unwrap(
        await api.post<AdminAuctionOverrideResult>(
          `/api/admin/auctions/${encodeURIComponent(listingId)}/override`,
          payload
        )
      ),
    onSuccess: (result, variables) => {
      const serverMs = Date.parse(result.serverTime) || Date.now();
      queryClient.setQueryData<AdminAuctionsResponse>(
        adminKeys.auctions(),
        (prev) => {
          if (!prev) return prev;
          const nextItems = prev.items.map((item) =>
            item.id === result.lot.id ? result.lot : item
          );
          return {
            items: nextItems,
            summary: recomputeSummary(nextItems, serverMs),
            serverTime: result.serverTime,
          };
        }
      );

      void queryClient.invalidateQueries({
        queryKey: adminKeys.auctions(),
      });
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.inventory(),
      });
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.dashboard(),
      });
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.auction(variables.listingId),
      });
    },
  });
}
