"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Gavel,
  ShieldCheck,
  Clock,
  CheckCircle,
  Check,
  Trash,
  CreditCard,
  WarningCircle,
  Handshake,
} from "@phosphor-icons/react";
import {
  useClearNotifications,
  useMarkNotificationsRead,
  useNotifications,
} from "@/hooks/useNotifications";
import type {
  NotificationItem,
  NotificationType,
} from "@/lib/types/notifications";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function formatFullTime(isoString: string, mounted: boolean): string {
  if (!mounted) {
    return isoString.slice(0, 10);
  }
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString.slice(0, 10);
  }
}

function isAuctionTabType(type: NotificationType): boolean {
  return type === "BID" || type === "AUCTION" || type === "MATCH";
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "BID":
    case "AUCTION":
      return Gavel;
    case "MATCH":
      return Handshake;
    case "KYC":
      return ShieldCheck;
    case "MODERATION":
      return Clock;
    case "BILLING":
      return CreditCard;
    case "DISPUTE":
      return WarningCircle;
    default:
      return CheckCircle;
  }
}

export default function SellerNotificationsPage() {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [filterType, setFilterType] = React.useState<
    "ALL" | "UNREAD" | "BID" | "SYSTEM"
  >("ALL");

  const { notifications, unreadCount, isLoading, isLive } = useNotifications({
    limit: 50,
  });
  const markRead = useMarkNotificationsRead();
  const clearAllNotifications = useClearNotifications();

  const markAllAsRead = () => {
    if (unreadCount === 0 || markRead.isPending) return;
    markRead.mutate({ markAll: true });
  };

  const markItemAsRead = (notif: NotificationItem) => {
    if (!notif.read) {
      markRead.mutate({ notificationIds: [notif.id] });
    }
  };

  const clearAll = () => {
    if (notifications.length === 0 || clearAllNotifications.isPending) return;
    clearAllNotifications.mutate();
  };

  const filteredNotifications = React.useMemo(() => {
    if (filterType === "ALL") return notifications;
    if (filterType === "UNREAD") return notifications.filter((n) => !n.read);
    if (filterType === "BID") {
      return notifications.filter((n) => isAuctionTabType(n.type));
    }
    return notifications.filter((n) => !isAuctionTabType(n.type));
  }, [notifications, filterType]);

  return (
    <div className="w-full max-w-[1200px] mx-auto py-4 sm:py-6 space-y-6">
      {/* Top Breadcrumb & Return to Dashboard */}
      <div>
        <Link
          href="/seller/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-portal-text-muted hover:text-portal-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="bold" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-portal-border">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-portal-text">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary border border-portal-primary/25">
                {unreadCount} unread
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-0.5 rounded-full border",
                isLive
                  ? "bg-success/10 text-success border-success/25"
                  : "bg-portal-surface-hover text-portal-text-muted border-portal-border"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isLive ? "bg-success" : "bg-portal-text-muted"
                )}
              />
              <span>{isLive ? "Live" : "Synced"}</span>
            </span>
          </div>
          <p className="mt-1 font-body text-xs sm:text-sm text-portal-text-muted">
            Live updates on dealer bids, moderation approvals, identity checks,
            and vehicle settlements.
          </p>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markRead.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-success" weight="bold" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={clearAllNotifications.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text-muted hover:text-error transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash className="w-4 h-4" weight="bold" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "ALL", label: "All Alerts", count: notifications.length },
          { id: "UNREAD", label: "Unread", count: unreadCount },
          {
            id: "BID",
            label: "Bids & Auctions",
            count: notifications.filter((n) => isAuctionTabType(n.type)).length,
          },
          {
            id: "SYSTEM",
            label: "System & KYC",
            count: notifications.filter((n) => !isAuctionTabType(n.type)).length,
          },
        ].map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl font-body text-xs font-semibold transition-all cursor-pointer border",
                isActive
                  ? "bg-portal-primary text-on-primary border-transparent shadow-xs"
                  : "bg-portal-surface border-portal-border text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover"
              )}
            >
              {tab.label} <span className="opacity-80">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Notifications Stream Container */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-portal-surface-hover animate-pulse"
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover mx-auto flex items-center justify-center text-portal-text-muted">
              <Bell className="w-6 h-6" weight="duotone" />
            </div>
            <h3 className="font-headline text-base font-bold text-portal-text">
              You are all caught up!
            </h3>
            <p className="font-body text-xs text-portal-text-muted max-w-sm mx-auto">
              There are no notifications matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-portal-border/60">
            {filteredNotifications.map((notif) => {
              const Icon = getNotificationIcon(notif.type);
              const href =
                notif.actionUrl ??
                (notif.listingId ? `/seller/listings/${notif.listingId}` : null);

              return (
                <div
                  key={notif.id}
                  onClick={() => markItemAsRead(notif)}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors cursor-pointer",
                    notif.read
                      ? "hover:bg-portal-surface-hover/70"
                      : "bg-portal-primary/[0.03] hover:bg-portal-surface-hover/90"
                  )}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-3 rounded-xl bg-portal-surface-hover text-portal-primary shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" weight="duotone" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline text-sm font-bold text-portal-text">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-portal-primary shrink-0" />
                        )}
                      </div>
                      <p className="font-body text-xs text-portal-text-muted leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 font-mono text-xs text-portal-text-muted">
                    <span>{formatFullTime(notif.createdAt, mounted)}</span>
                    {href && (
                      <Link
                        href={href}
                        onClick={(e) => {
                          e.stopPropagation();
                          markItemAsRead(notif);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text font-semibold text-xs transition-colors"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
