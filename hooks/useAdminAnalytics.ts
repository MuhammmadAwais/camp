"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import type {
  AdminAnalyticsResponse,
  AnalyticsTimeRange,
} from "@/lib/types/admin";

export type UseAdminAnalyticsParams = {
  range: AnalyticsTimeRange;
  province: string;
};

export function getAdminAnalyticsCsvUrl({
  range,
  province,
}: UseAdminAnalyticsParams): string {
  const params = new URLSearchParams({
    range,
    province,
    format: "csv",
  });
  return `/api/admin/analytics?${params.toString()}`;
}

export function useAdminAnalytics({ range, province }: UseAdminAnalyticsParams) {
  return useQuery({
    queryKey: adminKeys.analytics({ range, province }),
    queryFn: async (): Promise<AdminAnalyticsResponse> => {
      const params = new URLSearchParams({ range, province });
      return unwrap(
        await api.get<AdminAnalyticsResponse>(
          `/api/admin/analytics?${params.toString()}`
        )
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
