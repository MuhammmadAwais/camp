"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { adminKeys, sellerKeys } from "@/lib/query-keys";
import type {
  ModerationDecisionAction,
  ModerationItem,
  ModerationQueueResponse,
} from "@/lib/types/admin";

export function useAdminModerationQueue() {
  return useQuery({
    queryKey: adminKeys.moderationQueue(),
    queryFn: async (): Promise<ModerationQueueResponse> =>
      unwrap(await api.get<ModerationQueueResponse>("/api/admin/moderation")),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useAdminModerationDossier(id: string) {
  return useQuery({
    queryKey: adminKeys.moderationDetail(id),
    queryFn: async (): Promise<ModerationItem> =>
      unwrap(
        await api.get<ModerationItem>(
          `/api/admin/moderation/${encodeURIComponent(id)}`
        )
      ),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function useModerationDecision(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      action: ModerationDecisionAction;
      reason?: string;
    }) =>
      unwrap(
        await api.patch<ModerationItem>(
          `/api/admin/moderation/${encodeURIComponent(id)}`,
          payload
        )
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminKeys.moderationDetail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: adminKeys.moderationQueue(),
      });
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.dashboard(),
      });
    },
  });
}
