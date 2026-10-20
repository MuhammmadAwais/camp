"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Gavel,
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowRight,
  Check,
} from "@phosphor-icons/react";
import type { SellerNotificationItem } from "@/lib/types/seller";
import { cn } from "@/lib/utils";

interface Props {
  notifications: SellerNotificationItem[];
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SellerNotificationDropdown({ notifications: initialNotifications }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs",
          isOpen
            ? "border-[#8C383E] dark:border-[#E59344] bg-portal-surface-hover text-portal-text"
            : "border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text"
        )}
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" weight={unreadCount > 0 ? "fill" : "regular"} />

        {/* Unread Ping / Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C383E] dark:bg-[#E59344] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C383E] dark:bg-[#E59344]" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-portal-border bg-white dark:bg-[#131215] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden font-body">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-portal-border bg-portal-surface">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-sm text-portal-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8C383E]/10 text-[#8C383E] dark:bg-[#E59344]/15 dark:text-[#E59344]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-portal-text-muted hover:text-[#8C383E] dark:hover:text-[#E59344] transition-colors cursor-pointer"
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
                const Icon = getIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 p-3.5 transition-colors hover:bg-portal-surface-hover/80",
                      !notif.read && "bg-[#8C383E]/[0.03] dark:bg-[#E59344]/[0.04]"
                    )}
                  >
                    <div className="p-2 rounded-xl bg-portal-surface-hover text-[#8C383E] dark:text-[#E59344] shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" weight="duotone" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-headline text-xs font-semibold text-portal-text truncate">
                          {notif.title}
                        </p>
                        <span className="font-mono text-[10px] text-portal-text-muted shrink-0">
                          {formatRelativeTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="font-body text-xs text-portal-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link to Dedicated Page */}
          <div className="p-2.5 border-t border-portal-border bg-portal-surface text-center">
            <Link
              href="/seller/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-[#8C383E] dark:text-[#E59344] hover:underline"
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
