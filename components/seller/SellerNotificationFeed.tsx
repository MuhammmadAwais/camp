"use client";

import Link from "next/link";
import { Bell, CheckCircle2, Clock, Gavel, ShieldCheck } from "lucide-react";
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

export function SellerNotificationFeed({ notifications }: Props) {
  const iconMap = {
    BID: Gavel,
    KYC: ShieldCheck,
    MODERATION: Clock,
    SYSTEM: CheckCircle2,
  };

  const iconColorMap = {
    BID: "text-[#8C383E] dark:text-[#E59344] bg-[#8C383E]/10 dark:bg-[#E59344]/15",
    KYC: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    MODERATION: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    SYSTEM: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  };

  return (
    <aside className="rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6 transition-colors hover:border-[#8C383E]/30 dark:hover:border-[#E59344]/30 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-portal-border">
        <h2 className="flex items-center gap-2 font-headline text-base sm:text-lg font-bold text-portal-text">
          <Bell className="w-4 h-4 text-[#8C383E] dark:text-[#E59344]" aria-hidden />
          <span>Activity Feed</span>
        </h2>
        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-portal-surface-hover border border-portal-border text-portal-text-muted">
          {notifications.length}
        </span>
      </div>

      {notifications.length === 0 ? (
        <p className="py-8 text-center font-body text-sm text-portal-text-muted">You&apos;re all caught up.</p>
      ) : (
        <ul className="divide-y divide-portal-border/60 -mx-2 px-2 mt-2">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            const colorClass = iconColorMap[notif.type] || iconColorMap.SYSTEM;

            const content = (
              <div className="flex items-start gap-3 py-3.5 group rounded-xl px-2 transition-colors hover:bg-portal-surface-hover">
                <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body text-xs sm:text-sm font-semibold text-portal-text leading-tight group-hover:text-[#8C383E] dark:group-hover:text-[#E59344] transition-colors">
                      {notif.title}
                    </p>
                    <span className="font-mono text-[10px] text-portal-text-muted shrink-0">
                      {formatRelativeTime(notif.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs text-portal-text-muted line-clamp-2 leading-relaxed">
                    {notif.description}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#8C383E] dark:bg-[#E59344] shrink-0 mt-1.5" />
                )}
              </div>
            );

            return (
              <li key={notif.id}>
                {notif.listingId ? (
                  <Link href={`/seller/listings/${notif.listingId}`}>{content}</Link>
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
