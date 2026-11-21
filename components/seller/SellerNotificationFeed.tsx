"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Gavel,
  Handshake,
  ShieldCheck,
} from "lucide-react";
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

const iconMap: Record<NotificationType, typeof Bell> = {
  BID: Gavel,
  AUCTION: Gavel,
  MATCH: Handshake,
  KYC: ShieldCheck,
  MODERATION: Clock,
  BILLING: CreditCard,
  DISPUTE: AlertTriangle,
  SYSTEM: CheckCircle2,
};

const iconColorMap: Record<NotificationType, string> = {
  BID: "text-portal-primary bg-portal-primary/10",
  AUCTION: "text-portal-primary bg-portal-primary/10",
  MATCH: "text-success bg-success/10",
  KYC: "text-success bg-success/10",
  MODERATION: "text-warning bg-warning/10",
  BILLING: "text-brand-electric bg-brand-electric/10",
  DISPUTE: "text-error bg-error/10",
  SYSTEM: "text-brand-electric bg-brand-electric/10",
};

export function SellerNotificationFeed({
  notifications: fallbackNotifications,
}: Props) {
  const [nowMs, setNowMs] = React.useState<number | null>(null);
  const { data, notifications: liveNotifications, isLive } = useNotifications({
    limit: 20,
  });
  const markRead = useMarkNotificationsRead();

  React.useEffect(() => {
    const initTimer = setTimeout(() => setNowMs(Date.now()), 0);
    const interval = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const notifications = data
    ? liveNotifications
    : normalizeFallbackItems(fallbackNotifications);

  return (
    <aside className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-colors hover:border-portal-primary/30 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-portal-border">
        <h2 className="flex items-center gap-2 font-headline text-base sm:text-lg font-bold text-portal-text">
          <Bell className="w-4 h-4 text-portal-primary" aria-hidden />
          <span>Activity Feed</span>
          {isLive && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-success"
              title="Live feed active"
            />
          )}
        </h2>
        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-portal-surface-hover border border-portal-border text-portal-text-muted">
          {notifications.length}
        </span>
      </div>

      {notifications.length === 0 ? (
        <p className="py-8 text-center font-body text-sm text-portal-text-muted">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="divide-y divide-portal-border/60 -mx-2 px-2 mt-2">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            const colorClass = iconColorMap[notif.type] || iconColorMap.SYSTEM;
            const href =
              notif.actionUrl ??
              (notif.listingId ? `/seller/listings/${notif.listingId}` : null);

            const handleMarkRead = () => {
              if (!notif.read && data) {
                markRead.mutate({ notificationIds: [notif.id] });
              }
            };

            const content = (
              <div
                onClick={!href ? handleMarkRead : undefined}
                className="flex items-start gap-3 py-3.5 group rounded-xl px-2 transition-colors hover:bg-portal-surface-hover cursor-pointer"
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    colorClass
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body text-xs sm:text-sm font-semibold text-portal-text leading-tight group-hover:text-portal-primary transition-colors">
                      {notif.title}
                    </p>
                    <span className="font-mono text-[10px] text-portal-text-muted shrink-0">
                      {formatRelativeTime(notif.createdAt, nowMs)}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs text-portal-text-muted line-clamp-2 leading-relaxed">
                    {notif.description}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-portal-primary shrink-0 mt-1.5" />
                )}
              </div>
            );

            return (
              <li key={notif.id}>
                {href ? (
                  <Link href={href} onClick={handleMarkRead}>
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
