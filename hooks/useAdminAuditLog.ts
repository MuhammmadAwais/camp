"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import type {
  AdminAuditLogFilters,
  AdminAuditLogResponse,
} from "@/lib/types/admin";

function buildAuditQueryParams(
  filters: AdminAuditLogFilters & { format?: "json" | "csv" }
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page !== undefined && filters.format !== "csv") {
    params.set("page", String(filters.page));
  }
  if (filters.pageSize !== undefined && filters.format !== "csv") {
    params.set("pageSize", String(filters.pageSize));
  }
  if (filters.action && filters.action !== "ALL") {
    params.set("action", filters.action);
  }
  if (filters.actionGroup && filters.actionGroup !== "ALL") {
    params.set("actionGroup", filters.actionGroup);
  }
  if (filters.entityType && filters.entityType !== "ALL") {
    params.set("entityType", filters.entityType);
  }
  if (filters.province && filters.province !== "ALL") {
    params.set("province", filters.province);
  }
  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }
  if (filters.search && filters.search.trim().length > 0) {
    params.set("search", filters.search.trim());
  }
  if (filters.format === "csv") {
    params.set("format", "csv");
  }

  return params;
}

export function getAdminAuditLogCsvUrl(
  filters: Omit<AdminAuditLogFilters, "page" | "pageSize">
): string {
  const params = buildAuditQueryParams({ ...filters, format: "csv" });
  return `/api/admin/audit-log?${params.toString()}`;
}

export function useAdminAuditLog(filters: AdminAuditLogFilters) {
  const serializedFilters: Record<string, string | number | undefined> = {
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 15,
    action: filters.action,
    actionGroup: filters.actionGroup,
    entityType: filters.entityType,
    province: filters.province,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: filters.search,
  };

  return useQuery({
    queryKey: adminKeys.auditLog(serializedFilters),
    queryFn: async (): Promise<AdminAuditLogResponse> => {
      const params = buildAuditQueryParams(filters);
      return unwrap(
        await api.get<AdminAuditLogResponse>(
          `/api/admin/audit-log?${params.toString()}`
        )
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}
