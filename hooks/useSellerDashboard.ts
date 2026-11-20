"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, sellerKeys } from "@/lib/query-keys";
import type {
  AcceptOfferPayload,
  AcceptOfferResponse,
  ListingDetailData,
  SellerDashboardData,
} from "@/lib/types/seller";

export function useSellerDashboard(view: "default" | "empty" = "default") {
  return useQuery({
    queryKey: [...sellerKeys.dashboard(), view],
    queryFn: async (): Promise<SellerDashboardData> => {
      const endpoint =
        view === "empty"
          ? "/api/seller/dashboard?view=empty"
          : "/api/seller/dashboard";
      return unwrap(await api.get<SellerDashboardData>(endpoint));
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // Background telemetry refresh
  });
}

export function useSellerListingDetail(listingId: string) {
  return useQuery({
    queryKey: sellerKeys.auction(listingId),
    queryFn: async (): Promise<ListingDetailData> =>
      unwrap(
        await api.get<ListingDetailData>(
          `/api/listings/${encodeURIComponent(listingId)}`
        )
      ),
    enabled: Boolean(listingId),
    staleTime: 15 * 1000,
  });
}

export function useAcceptDealerBid(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: AcceptOfferPayload
    ): Promise<AcceptOfferResponse> =>
      unwrap(
        await api.post<AcceptOfferResponse>(
          `/api/listings/${encodeURIComponent(listingId)}`,
          payload
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.auction(listingId),
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
