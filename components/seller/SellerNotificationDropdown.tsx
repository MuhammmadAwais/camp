"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import {
  Bell,
  Gavel,
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowRight,
  Check,
  CreditCard,
  WarningCircle,
  Handshake,
} from "@phosphor-icons/react";
import {
  useMarkNotificationsRead,
  useNotifications,
} from "@/hooks/useNotifications";
import type {
  NotificationItem,
  NotificationType,
} from "@/lib/types/notifications";
import type { SellerNotificationItem } from "@/lib/types/seller";
import { cn } from "@/lib/utils";

interface Props {
  notifications?: SellerNotificationItem[];
}

function formatRelativeTime(isoString: string, nowMs: number | null): string {
  if (nowMs === null) {
    return isoString.slice(0, 10);
  }
  const parsed = Date.parse(isoString);
  if (!Number.isFinite(parsed)) return isoString.slice(0, 10);
  const diff = Math.max(0, nowMs - parsed);
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function normalizeFallbackItems(
  items: readonly SellerNotificationItem[] | undefined
): NotificationItem[] {
  if (!items) return [];
  return items.map((n) => ({
    id: n.id,
    userId: "",
    type: n.type,
    title: n.title,
    description: n.description,
    listingId: n.listingId ?? null,
    actionUrl: n.listingId ? `/seller/listings/${n.listingId}` : null,
    metadata: {},
    read: n.read,
    readAt: null,
    createdAt: n.timestamp,
  }));
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

export function SellerNotificationDropdown({
  notifications: fallbackNotifications,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [nowMs, setNowMs] = React.useState<number | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    data,
    notifications: liveNotifications,
    unreadCount: liveUnreadCount,
    isLive,
  } = useNotifications({ limit: 25 });
  const markRead = useMarkNotificationsRead();

  React.useEffect(() => {
    const initTimer = setTimeout(() => setNowMs(Date.now()), 0);
    const interval = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const notifications = data
    ? liveNotifications
    : normalizeFallbackItems(fallbackNotifications);
  const unreadCount = data
    ? liveUnreadCount
    : notifications.filter((n) => !n.read).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0 || markRead.isPending) return;
    markRead.mutate({ markAll: true });
  };

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.read && data) {
      markRead.mutate({ notificationIds: [notif.id] });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs",
          isOpen
            ? "border-portal-primary bg-portal-surface-hover text-portal-text"
            : "border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
        )}
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" weight={unreadCount > 0 ? "fill" : "regular"} />

        {/* Unread Ping / Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-portal-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-portal-primary" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-portal-border bg-portal-surface shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden font-body">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-portal-border bg-portal-surface">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-sm text-portal-text">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary">
                  {unreadCount} new
                </span>
              )}
              {isLive && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-success"
                  title="Live notifications active"
                />
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markRead.isPending}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-portal-text-muted hover:text-portal-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3 h-3" weight="bold" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-portal-border/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-portal-text-muted">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                const href =
                  notif.actionUrl ??
                  (notif.listingId ? `/seller/listings/${notif.listingId}` : null);

                const rowContent = (
                  <div
                    onClick={!href ? () => handleItemClick(notif) : undefined}
                    className={cn(
                      "flex items-start gap-3 p-3.5 transition-colors hover:bg-portal-surface-hover/80 cursor-pointer",
                      !notif.read && "bg-portal-primary/[0.04]"
                    )}
                  >
                    <div className="p-2 rounded-xl bg-portal-surface-hover text-portal-primary shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" weight="duotone" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-headline text-xs font-semibold text-portal-text truncate">
                          {notif.title}
                        </p>
                        <span className="font-mono text-[10px] text-portal-text-muted shrink-0">
                          {formatRelativeTime(notif.createdAt, nowMs)}
                        </span>
                      </div>
                      <p className="font-body text-xs text-portal-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-portal-primary shrink-0 mt-2" />
                    )}
                  </div>
                );

                return href ? (
                  <Link
                    key={notif.id}
                    href={href}
                    onClick={() => handleItemClick(notif)}
                    className="block"
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div key={notif.id}>{rowContent}</div>
                );
              })
            )}
          </div>

          {/* Footer Link to Dedicated Page */}
          <div className="p-2.5 border-t border-portal-border bg-portal-surface text-center">
            <Link
              href="/seller/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-portal-primary hover:underline"
            >
              <span>View all notifications</span>
              <ArrowRight className="w-3.5 h-3.5" weight="bold" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
