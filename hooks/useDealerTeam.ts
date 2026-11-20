"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap } from "@/lib/api-client";
import { dealerKeys } from "@/lib/query-keys";
import type {
  DealerTeamMutationResponse,
  DealerTeamResponse,
  InviteDealerMemberPayload,
  UpdateDealerMemberRolePayload,
} from "@/lib/types/dealer";

export function useDealerTeam() {
  return useQuery({
    queryKey: dealerKeys.team(),
    queryFn: async (): Promise<DealerTeamResponse> =>
      unwrap(await api.get<DealerTeamResponse>("/api/dealer/team")),
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.failure.status === 401 || error.failure.status === 403)
      ) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 15 * 1000,
  });
}

export function useInviteDealerMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: InviteDealerMemberPayload
    ): Promise<DealerTeamMutationResponse> =>
      unwrap(
        await api.post<DealerTeamMutationResponse>("/api/dealer/team", payload)
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealerKeys.team() });
    },
  });
}

export function useUpdateDealerMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: UpdateDealerMemberRolePayload;
    }): Promise<DealerTeamMutationResponse> =>
      unwrap(
        await api.patch<DealerTeamMutationResponse>(
          `/api/dealer/team/${encodeURIComponent(memberId)}`,
          payload
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealerKeys.team() });
    },
  });
}

export function useRemoveDealerMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      memberId: string
    ): Promise<DealerTeamMutationResponse> =>
      unwrap(
        await api.delete<DealerTeamMutationResponse>(
          `/api/dealer/team/${encodeURIComponent(memberId)}`
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealerKeys.team() });
    },
  });
}
