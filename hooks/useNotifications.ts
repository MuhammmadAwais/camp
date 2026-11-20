"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api-client";
import { notificationKeys, sellerKeys } from "@/lib/query-keys";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  ClearNotificationsResponse,
  MarkNotificationsReadPayload,
  MarkNotificationsReadResponse,
  NotificationItem,
  NotificationType,
  NotificationsListResponse,
} from "@/lib/types/notifications";

export type NotificationRealtimeState =
  | "CONNECTING"
  | "SUBSCRIBED"
  | "DISCONNECTED";

const VALID_TYPES: readonly NotificationType[] = [
  "BID",
  "KYC",
  "MODERATION",
  "AUCTION",
  "MATCH",
  "BILLING",
  "DISPUTE",
  "SYSTEM",
];

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function parseNotificationRecord(raw: unknown): NotificationItem | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.user_id !== "string") {
    return null;
  }

  const rawType = typeof raw.type === "string" ? raw.type : "SYSTEM";
  const type = VALID_TYPES.find((t) => t === rawType) ?? "SYSTEM";
  const metadata = isRecord(raw.metadata) ? raw.metadata : {};
  const actionUrl =
    typeof metadata.actionUrl === "string" && metadata.actionUrl.startsWith("/")
      ? metadata.actionUrl
      : null;

  return {
    id: raw.id,
    userId: raw.user_id,
    type,
    title: typeof raw.title === "string" ? raw.title : "Notification",
    description: typeof raw.description === "string" ? raw.description : "",
    listingId: typeof raw.listing_id === "string" ? raw.listing_id : null,
    actionUrl,
    metadata,
    read: raw.read === true,
    readAt: typeof raw.read_at === "string" ? raw.read_at : null,
    createdAt:
      typeof raw.created_at === "string"
        ? raw.created_at
        : new Date().toISOString(),
  };
}

export type UseNotificationsOptions = {
  limit?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
  enabled?: boolean;
};

/**
 * Queries persistent notifications from `/api/notifications` and maintains a
 * user-scoped Supabase Realtime subscription on `public.notifications` so new
 * alerts and unread counters update live without polling.
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 30, type, unreadOnly = false, enabled = true } = options;
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] =
    useState<NotificationRealtimeState>("CONNECTING");

  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(limit));
  if (type) queryParams.set("type", type);
  if (unreadOnly) queryParams.set("unreadOnly", "true");
  const endpoint = `/api/notifications?${queryParams.toString()}`;

  const query = useQuery({
    queryKey: notificationKeys.list({ limit, type, unreadOnly }),
    queryFn: async (): Promise<NotificationsListResponse> =>
      unwrap(await api.get<NotificationsListResponse>(endpoint)),
    enabled,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function subscribeToNotifications() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session?.access_token || !session.user?.id) {
          if (!cancelled) setConnectionState("DISCONNECTED");
          return;
        }

        await supabase.realtime.setAuth(session.access_token);
        if (cancelled) return;

        const userId = session.user.id;
        const nextChannel = supabase
          .channel(`user-notifications:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const incoming = parseNotificationRecord(payload.new);
              if (incoming) {
                queryClient.setQueriesData<NotificationsListResponse>(
                  { queryKey: notificationKeys.all },
                  (prev) => {
                    if (!prev) return prev;
                    if (prev.items.some((i) => i.id === incoming.id)) {
                      return prev;
                    }
                    const nextItems = [incoming, ...prev.items].slice(
                      0,
                      Math.max(limit, prev.items.length)
                    );
                    return {
                      ...prev,
                      items: nextItems,
                      unreadCount: prev.unreadCount + (incoming.read ? 0 : 1),
                      totalCount: prev.totalCount + 1,
                    };
                  }
                );
              }
              void queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
              });
              void queryClient.invalidateQueries({
                queryKey: sellerKeys.dashboard(),
              });
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              void queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
              });
              void queryClient.invalidateQueries({
                queryKey: sellerKeys.dashboard(),
              });
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              void queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
              });
              void queryClient.invalidateQueries({
                queryKey: sellerKeys.dashboard(),
              });
            }
          )
          .subscribe((subStatus) => {
            if (cancelled) return;
            if (subStatus === "SUBSCRIBED") {
              setConnectionState("SUBSCRIBED");
            } else if (
              subStatus === "CHANNEL_ERROR" ||
              subStatus === "TIMED_OUT" ||
              subStatus === "CLOSED"
            ) {
              setConnectionState("DISCONNECTED");
            }
          });

        channel = nextChannel;
        if (cancelled) {
          void supabase.removeChannel(nextChannel);
        }
      } catch {
        if (!cancelled) {
          setConnectionState("DISCONNECTED");
        }
      }
    }

    void subscribeToNotifications();

    return () => {
      cancelled = true;
      if (channel) {
        void createBrowserSupabaseClient().removeChannel(channel);
      }
    };
  }, [enabled, limit, queryClient]);

  const resolvedState: NotificationRealtimeState = enabled
    ? connectionState
    : "DISCONNECTED";

  return {
    ...query,
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    totalCount: query.data?.totalCount ?? 0,
    connectionState: resolvedState,
    isLive: resolvedState === "SUBSCRIBED",
  };
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: MarkNotificationsReadPayload
    ): Promise<MarkNotificationsReadResponse> =>
      unwrap(
        await api.patch<MarkNotificationsReadResponse>(
          "/api/notifications",
          payload
        )
      ),
    onSuccess: (res, variables) => {
      queryClient.setQueriesData<NotificationsListResponse>(
        { queryKey: notificationKeys.all },
        (prev) => {
          if (!prev) return prev;
          const markedIds = new Set(variables.notificationIds ?? []);
          const nextItems = prev.items.map((item) => {
            if (variables.markAll || markedIds.has(item.id)) {
              return { ...item, read: true, readAt: res.serverTime };
            }
            return item;
          });
          return {
            ...prev,
            items: nextItems,
            unreadCount: res.unreadCount,
          };
        }
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: sellerKeys.dashboard() });
    },
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ClearNotificationsResponse> =>
      unwrap(await api.delete<ClearNotificationsResponse>("/api/notifications")),
    onSuccess: () => {
      queryClient.setQueriesData<NotificationsListResponse>(
        { queryKey: notificationKeys.all },
        (prev) =>
          prev
            ? {
                ...prev,
                items: [],
                unreadCount: 0,
                totalCount: 0,
              }
            : prev
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: sellerKeys.dashboard() });
    },
  });
}
