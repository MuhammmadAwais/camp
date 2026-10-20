"use client";

import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { sellerKeys } from "@/lib/query-keys";
import type { SellerDashboardData } from "@/lib/types/seller";

export function useSellerDashboard(view: "default" | "empty" = "default") {
  return useQuery({
    queryKey: [...sellerKeys.dashboard(), view],
    queryFn: async (): Promise<SellerDashboardData> => {
      const endpoint = view === "empty" ? "/api/seller/dashboard?view=empty" : "/api/seller/dashboard";
      return unwrap(await api.get<SellerDashboardData>(endpoint));
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // Background telemetry refresh
  });
}
