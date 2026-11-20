"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import {
  adminKeys,
  authKeys,
  sellerKeys,
  settingsKeys,
} from "@/lib/query-keys";
import type {
  AdminPlatformConfigResponse,
  ProfileSettingsResponse,
  RelistVehiclePayload,
  RelistVehicleResponse,
  SecuritySettingsResponse,
  UpdatePlatformConfigPayload,
  UpdatePlatformConfigResponse,
  UpdateProfileSettingsPayload,
  UpdateSecurityPayload,
  UpdateSecurityResponse,
} from "@/lib/types/settings";

export function useProfileSettings() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: async (): Promise<ProfileSettingsResponse> =>
      unwrap(await api.get<ProfileSettingsResponse>("/api/settings/profile")),
    staleTime: 30 * 1000,
  });
}

export function useUpdateProfileSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdateProfileSettingsPayload
    ): Promise<ProfileSettingsResponse> =>
      unwrap(
        await api.patch<ProfileSettingsResponse>(
          "/api/settings/profile",
          payload
        )
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.profile(), updated);
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useSecuritySettings() {
  return useQuery({
    queryKey: settingsKeys.security(),
    queryFn: async (): Promise<SecuritySettingsResponse> =>
      unwrap(
        await api.get<SecuritySettingsResponse>("/api/settings/security")
      ),
    staleTime: 30 * 1000,
  });
}

export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdateSecurityPayload
    ): Promise<UpdateSecurityResponse> =>
      unwrap(
        await api.patch<UpdateSecurityResponse>(
          "/api/settings/security",
          payload
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.security() });
    },
  });
}

export function useAdminPlatformConfig(enabled = true) {
  return useQuery({
    queryKey: adminKeys.config(),
    queryFn: async (): Promise<AdminPlatformConfigResponse> =>
      unwrap(await api.get<AdminPlatformConfigResponse>("/api/admin/config")),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useUpdateAdminPlatformConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdatePlatformConfigPayload
    ): Promise<UpdatePlatformConfigResponse> =>
      unwrap(
        await api.patch<UpdatePlatformConfigResponse>(
          "/api/admin/config",
          payload
        )
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminKeys.config(), updated);
    },
  });
}

export function useRelistVehicle(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: RelistVehiclePayload = {}
    ): Promise<RelistVehicleResponse> =>
      unwrap(
        await api.post<RelistVehicleResponse>(
          `/api/listings/${encodeURIComponent(listingId)}/relist`,
          payload
        )
      ),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: sellerKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: sellerKeys.auctions() });
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.auction(listingId),
      });
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.auction(res.listing.id),
      });
      void queryClient.invalidateQueries({
        queryKey: adminKeys.moderationQueue(),
      });
    },
  });
}
