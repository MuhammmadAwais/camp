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
  Funnel,
  Trash,
} from "@phosphor-icons/react";
import { useSellerDashboard } from "@/hooks/useSellerDashboard";
import type { SellerNotificationItem } from "@/lib/types/seller";
import { cn } from "@/lib/utils";

function formatFullTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function SellerNotificationsPage() {
  const { data, isLoading, refetch } = useSellerDashboard("default");
  const [notifications, setNotifications] = React.useState<SellerNotificationItem[]>([]);
  const [filterType, setFilterType] = React.useState<"ALL" | "UNREAD" | "BID" | "SYSTEM">("ALL");

  React.useEffect(() => {
    if (data?.notifications) {
      setNotifications(data.notifications);
    }
  }, [data?.notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = React.useMemo(() => {
    if (filterType === "ALL") return notifications;
    if (filterType === "UNREAD") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const getIcon = (type: SellerNotificationItem["type"]) => {
    switch (type) {
      case "BID":
        return Gavel;
      case "KYC":
        return ShieldCheck;
      case "MODERATION":
        return Clock;
      default:
        return CheckCircle;
    }
  };

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
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-portal-text">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#8C383E]/10 text-[#8C383E] dark:bg-[#E59344]/15 dark:text-[#E59344] border border-[#8C383E]/20 dark:border-[#E59344]/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 font-body text-xs sm:text-sm text-portal-text-muted">
            Live updates on dealer bids, moderation approvals, identity checks, and vehicle settlements.
          </p>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" weight="bold" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text-muted hover:text-red-600 transition-colors cursor-pointer shadow-xs"
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
          { id: "BID", label: "Bids & Auctions", count: notifications.filter((n) => n.type === "BID").length },
          { id: "SYSTEM", label: "System & KYC", count: notifications.filter((n) => n.type !== "BID").length },
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
                  ? "bg-[#8C383E] dark:bg-[#E59344] text-white border-transparent shadow-xs"
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
              <div key={i} className="h-16 rounded-xl bg-portal-surface-hover animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-portal-surface-hover mx-auto flex items-center justify-center text-portal-text-muted">
              <Bell className="w-6 h-6" weight="duotone" />
            </div>
            <h3 className="font-headline text-base font-bold text-portal-text">You are all caught up!</h3>
            <p className="font-body text-xs text-portal-text-muted max-w-sm mx-auto">
              There are no notifications matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-portal-border/60">
            {filteredNotifications.map((notif) => {
              const Icon = getIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => markItemAsRead(notif.id)}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors cursor-pointer",
                    notif.read ? "hover:bg-portal-surface-hover/70" : "bg-[#8C383E]/[0.02] dark:bg-[#E59344]/[0.03] hover:bg-portal-surface-hover/90"
                  )}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-3 rounded-xl bg-portal-surface-hover text-[#8C383E] dark:text-[#E59344] shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" weight="duotone" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline text-sm font-bold text-portal-text">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#8C383E] dark:bg-[#E59344] shrink-0" />
                        )}
                      </div>
                      <p className="font-body text-xs text-portal-text-muted leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 font-mono text-xs text-portal-text-muted">
                    <span>{formatFullTime(notif.timestamp)}</span>
                    {notif.listingId && (
                      <Link
                        href={`/seller/listings/${notif.listingId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text font-semibold text-xs transition-colors"
                      >
                        View Vehicle →
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
