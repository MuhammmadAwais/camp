"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, dealerKeys } from "@/lib/query-keys";
import type { AdminSubscriptionsResponse } from "@/lib/types/admin";
import type {
  DealerBillingInvoicesResponse,
  DealerBillingPortalResponse,
  DealerCheckoutPayload,
  DealerCheckoutResponse,
  DealerSubscriptionResponse,
} from "@/lib/types/dealer";

export type DealerInvoicesFilters = {
  year?: string;
  status?: string;
  search?: string;
};

function buildInvoicesQueryParams(
  filters: DealerInvoicesFilters & { format?: "json" | "csv" }
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.year && filters.year !== "ALL") {
    params.set("year", filters.year);
  }
  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }
  if (filters.search && filters.search.trim().length > 0) {
    params.set("search", filters.search.trim());
  }
  if (filters.format === "csv") {
    params.set("format", "csv");
  }
  return params;
}

export function getDealerInvoicesCsvUrl(
  filters: DealerInvoicesFilters = {}
): string {
  const params = buildInvoicesQueryParams({ ...filters, format: "csv" });
  return `/api/dealer/billing/invoices?${params.toString()}`;
}

export function useDealerSubscription() {
  return useQuery({
    queryKey: dealerKeys.subscription(),
    queryFn: async (): Promise<DealerSubscriptionResponse> =>
      unwrap(
        await api.get<DealerSubscriptionResponse>("/api/dealer/subscription")
      ),
    staleTime: 30 * 1000,
  });
}

export function useLaunchDealerCheckout() {
  return useMutation({
    mutationFn: async (
      payload: DealerCheckoutPayload
    ): Promise<DealerCheckoutResponse> =>
      unwrap(
        await api.post<DealerCheckoutResponse>(
          "/api/dealer/subscription/checkout",
          payload
        )
      ),
  });
}

export function useLaunchDealerBillingPortal() {
  return useMutation({
    mutationFn: async (): Promise<DealerBillingPortalResponse> =>
      unwrap(
        await api.post<DealerBillingPortalResponse>(
          "/api/dealer/subscription/portal"
        )
      ),
  });
}

export function useDealerInvoices(filters: DealerInvoicesFilters = {}) {
  const keyFilters: Record<string, string | undefined> = {
    year: filters.year,
    status: filters.status,
    search: filters.search,
  };

  return useQuery({
    queryKey: dealerKeys.invoices(keyFilters),
    queryFn: async (): Promise<DealerBillingInvoicesResponse> => {
      const params = buildInvoicesQueryParams(filters);
      const qs = params.toString();
      return unwrap(
        await api.get<DealerBillingInvoicesResponse>(
          qs
            ? `/api/dealer/billing/invoices?${qs}`
            : "/api/dealer/billing/invoices"
        )
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useAdminSubscriptions(
  filters: { status?: string; province?: string; search?: string } = {}
) {
  return useQuery({
    queryKey: adminKeys.subscriptions(filters),
    queryFn: async (): Promise<AdminSubscriptionsResponse> => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") {
        params.set("status", filters.status);
      }
      if (filters.province && filters.province !== "ALL") {
        params.set("province", filters.province);
      }
      if (filters.search && filters.search.trim().length > 0) {
        params.set("search", filters.search.trim());
      }
      const qs = params.toString();
      return unwrap(
        await api.get<AdminSubscriptionsResponse>(
          qs ? `/api/admin/subscriptions?${qs}` : "/api/admin/subscriptions"
        )
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
