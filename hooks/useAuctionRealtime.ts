"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { dealerKeys, sellerKeys } from "@/lib/query-keys";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { DealerInventoryResponse, VehicleInspectionDetails } from "@/lib/types/dealer";
import type {
  AuctionStatus,
  ListingDetailData,
  SellerDashboardData,
} from "@/lib/types/seller";

export type RealtimeConnectionState =
  | "CONNECTING"
  | "SUBSCRIBED"
  | "DISCONNECTED";

export type ServerSyncedCountdownOptions = {
  auctionEndsAt?: string | null;
  serverTime?: string | null;
  dataUpdatedAt?: number;
  isActive: boolean;
  onElapsed?: () => void;
};

export type CountdownState = {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isUrgent: boolean;
  isExpired: boolean;
  serverOffsetMs: number;
  formatted: string;
};

export type UseAuctionRealtimeOptions = {
  listingId?: string;
  auctionEndsAt?: string | null;
  serverTime?: string | null;
  dataUpdatedAt?: number;
  status?: string;
  enabled?: boolean;
  portal: "seller" | "dealer";
};

type ListingTelemetryPatch = {
  id: string;
  bidCount?: number;
  status?: AuctionStatus;
  auctionEndsAt?: string;
};

const VALID_AUCTION_STATUSES: readonly AuctionStatus[] = [
  "DRAFT",
  "PENDING_MODERATION",
  "EDITS_REQUESTED",
  "REJECTED",
  "ACTIVE",
  "UNSEALED",
  "ACCEPTED",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
];

const POST_AUCTION_STATUSES = new Set<AuctionStatus>([
  "UNSEALED",
  "ACCEPTED",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
]);

const emptySubscribe = () => () => {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAuctionStatus(raw: unknown): AuctionStatus | undefined {
  if (typeof raw !== "string") return undefined;
  return VALID_AUCTION_STATUSES.find((status) => status === raw);
}

/**
 * Extracts strictly non-financial auction telemetry (`id`, `bid_count`, `status`,
 * `auction_ends_at`) from a Realtime WAL record — never reads or stores reserve/bid amounts.
 */
function extractTelemetryPatch(rawNew: unknown): ListingTelemetryPatch | null {
  if (!isRecord(rawNew) || typeof rawNew.id !== "string") {
    return null;
  }

  const bidCount =
    typeof rawNew.bid_count === "number" && Number.isFinite(rawNew.bid_count)
      ? rawNew.bid_count
      : undefined;
  const status = parseAuctionStatus(rawNew.status);
  const auctionEndsAt =
    typeof rawNew.auction_ends_at === "string"
      ? rawNew.auction_ends_at
      : undefined;

  return {
    id: rawNew.id,
    bidCount,
    status,
    auctionEndsAt,
  };
}

/**
 * Computes a server-time-offset-corrected live countdown synced against the API
 * payload `serverTime` and TanStack Query `dataUpdatedAt` (eliminating client clock skew).
 */
export function useServerSyncedCountdown({
  auctionEndsAt,
  serverTime,
  dataUpdatedAt,
  isActive,
  onElapsed,
}: ServerSyncedCountdownOptions): CountdownState {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [clientNowMs, setClientNowMs] = useState<number>(() => Date.now());
  const onElapsedRef = useRef(onElapsed);
  const firedForEndRef = useRef<string | null>(null);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  const serverOffsetMs = useMemo(() => {
    if (!serverTime || !dataUpdatedAt || dataUpdatedAt <= 0) return 0;
    const parsedServerMs = Date.parse(serverTime);
    if (!Number.isFinite(parsedServerMs)) return 0;
    return parsedServerMs - dataUpdatedAt;
  }, [serverTime, dataUpdatedAt]);

  useEffect(() => {
    if (!isActive || !auctionEndsAt) return;
    const interval = setInterval(() => {
      setClientNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, auctionEndsAt]);

  const countdown = useMemo<CountdownState>(() => {
    if (!mounted || !auctionEndsAt) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isUrgent: false,
        isExpired: !isActive && Boolean(auctionEndsAt),
        serverOffsetMs,
        formatted: "00h 00m 00s",
      };
    }

    const endMs = Date.parse(auctionEndsAt);
    if (!Number.isFinite(endMs) || !isActive) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isUrgent: false,
        isExpired: !isActive,
        serverOffsetMs,
        formatted: "00h 00m 00s",
      };
    }

    const totalMs = Math.max(0, endMs - (clientNowMs + serverOffsetMs));
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
    const formatted = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

    return {
      hours,
      minutes,
      seconds,
      totalMs,
      isUrgent: totalMs > 0 && totalMs < 15 * 60 * 1000,
      isExpired: totalMs <= 0,
      serverOffsetMs,
      formatted,
    };
  }, [mounted, auctionEndsAt, isActive, clientNowMs, serverOffsetMs]);

  useEffect(() => {
    if (
      !mounted ||
      !isActive ||
      !auctionEndsAt ||
      countdown.totalMs > 0 ||
      firedForEndRef.current === auctionEndsAt
    ) {
      return;
    }

    const timer = setTimeout(() => {
      firedForEndRef.current = auctionEndsAt;
      onElapsedRef.current?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [mounted, isActive, auctionEndsAt, countdown.totalMs]);

  return countdown;
}

/**
 * Subscribes via Supabase Realtime WebSockets to `public.listings` UPDATE events
 * for live sealed `bid_count`, `status`, and `auction_ends_at` synchronization
 * across Seller and Dealer portals without HTTP polling or bid-amount broadcasting.
 */
export function useAuctionRealtime({
  listingId,
  auctionEndsAt,
  serverTime,
  dataUpdatedAt,
  status,
  enabled = true,
  portal,
}: UseAuctionRealtimeOptions) {
  // TODO(senior-review): Before production cutover (or in Prompt B8.2), move dealer Realtime subscriptions onto a dedicated public.auction_telemetry mirror table or Realtime Broadcast trigger emitting only (id, status, bid_count, auction_ends_at) so listings.reserve_price_cents never appears in dealer-bound WAL frames.
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("CONNECTING");

  const applyTelemetryPatch = useCallback(
    (patch: ListingTelemetryPatch) => {
      if (portal === "seller") {
        queryClient.setQueryData<ListingDetailData>(
          sellerKeys.auction(patch.id),
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              auction: {
                ...prev.auction,
                bidCount: patch.bidCount ?? prev.auction.bidCount,
                status: patch.status ?? prev.auction.status,
                auctionEndsAt:
                  patch.auctionEndsAt ?? prev.auction.auctionEndsAt,
              },
            };
          }
        );

        queryClient.setQueriesData<SellerDashboardData>(
          { queryKey: sellerKeys.dashboard() },
          (prev) => {
            if (!prev) return prev;
            let matched = false;
            const nextAuctions = prev.auctions.map((item) => {
              if (item.id !== patch.id) return item;
              matched = true;
              return {
                ...item,
                bidCount: patch.bidCount ?? item.bidCount,
                status: patch.status ?? item.status,
                auctionEndsAt: patch.auctionEndsAt ?? item.auctionEndsAt,
              };
            });
            if (!matched) return prev;
            return {
              ...prev,
              auctions: nextAuctions,
              stats: {
                ...prev.stats,
                activeAuctionsCount: nextAuctions.filter(
                  (a) => a.status === "ACTIVE"
                ).length,
                totalBidsReceived: nextAuctions.reduce(
                  (sum, a) => sum + a.bidCount,
                  0
                ),
              },
            };
          }
        );

        if (patch.status && POST_AUCTION_STATUSES.has(patch.status)) {
          void queryClient.invalidateQueries({
            queryKey: sellerKeys.auction(patch.id),
          });
          void queryClient.invalidateQueries({
            queryKey: sellerKeys.dashboard(),
          });
        }
        return;
      }

      // Portal === "dealer"
      queryClient.setQueryData<VehicleInspectionDetails>(
        dealerKeys.auction(patch.id),
        (prev) => {
          if (!prev) return prev;
          const nextStatus = patch.status ?? prev.status;
          const nextEndsAt = patch.auctionEndsAt ?? prev.auctionEndsAt;
          const isOpen =
            nextStatus === "ACTIVE" &&
            Date.parse(nextEndsAt) > Date.now();
          return {
            ...prev,
            totalBidsPlaced: patch.bidCount ?? prev.totalBidsPlaced,
            status: nextStatus,
            auctionEndsAt: nextEndsAt,
            isAuctionOpen: isOpen,
          };
        }
      );

      let foundInInventory = false;
      queryClient.setQueryData<DealerInventoryResponse>(
        dealerKeys.inventory(),
        (prev) => {
          if (!prev) return prev;
          const existingIdx = prev.items.findIndex(
            (item) => item.id === patch.id
          );
          if (existingIdx === -1) return prev;
          foundInInventory = true;

          if (patch.status && patch.status !== "ACTIVE") {
            const nextItems = prev.items.filter((item) => item.id !== patch.id);
            return {
              ...prev,
              items: nextItems,
              totalCount: nextItems.length,
            };
          }

          const nextItems = prev.items.map((item) =>
            item.id === patch.id
              ? {
                  ...item,
                  totalBidsPlaced: patch.bidCount ?? item.totalBidsPlaced,
                  auctionEndsAt: patch.auctionEndsAt ?? item.auctionEndsAt,
                }
              : item
          );
          return {
            ...prev,
            items: nextItems,
          };
        }
      );

      if (patch.status && patch.status !== "ACTIVE") {
        void queryClient.invalidateQueries({
          queryKey: dealerKeys.auction(patch.id),
        });
        void queryClient.invalidateQueries({
          queryKey: dealerKeys.inventory(),
        });
        void queryClient.invalidateQueries({
          queryKey: dealerKeys.activeBids(),
        });
      } else if (!foundInInventory && patch.status === "ACTIVE") {
        // Newly approved auction entered the active floor
        void queryClient.invalidateQueries({
          queryKey: dealerKeys.inventory(),
        });
      }
    },
    [portal, queryClient]
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    const supabase = createBrowserSupabaseClient();

    async function subscribeToTelemetry() {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session?.access_token) {
          await supabase.realtime.setAuth(data.session.access_token);
        }
        if (cancelled) return;

        const channelName = listingId
          ? `auction-telemetry:${portal}:${listingId}`
          : `auction-floor:${portal}`;

        const nextChannel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "listings",
              ...(listingId ? { filter: `id=eq.${listingId}` } : {}),
            },
            (payload) => {
              const patch = extractTelemetryPatch(payload.new);
              if (patch) {
                applyTelemetryPatch(patch);
              }
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

    void subscribeToTelemetry();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [enabled, listingId, portal, applyTelemetryPatch]);

  const handleElapsed = useCallback(() => {
    if (portal === "seller") {
      if (listingId) {
        void queryClient.invalidateQueries({
          queryKey: sellerKeys.auction(listingId),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: sellerKeys.dashboard(),
      });
      return;
    }

    if (listingId) {
      void queryClient.invalidateQueries({
        queryKey: dealerKeys.auction(listingId),
      });
    }
    void queryClient.invalidateQueries({
      queryKey: dealerKeys.inventory(),
    });
    void queryClient.invalidateQueries({
      queryKey: dealerKeys.activeBids(),
    });
  }, [portal, listingId, queryClient]);

  const isActive = status ? status === "ACTIVE" : Boolean(auctionEndsAt);
  const countdown = useServerSyncedCountdown({
    auctionEndsAt,
    serverTime,
    dataUpdatedAt,
    isActive,
    onElapsed: handleElapsed,
  });

  const resolvedConnectionState: RealtimeConnectionState = enabled
    ? connectionState
    : "DISCONNECTED";

  return {
    countdown,
    connectionState: resolvedConnectionState,
    isLive: resolvedConnectionState === "SUBSCRIBED",
  };
}
