"use client";

import React, { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import { useCurrentUser } from "@/hooks/useSession";
import { api } from "@/lib/api-client";
import { authKeys, settingsKeys } from "@/lib/query-keys";

interface LocaleSwitcherProps {
  variant?: "segmented" | "compact" | "pill";
  className?: string;
}

export function LocaleSwitcher({
  variant = "segmented",
  className = "",
}: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const handleSelectLocale = (targetLocale: AppLocale) => {
    if (targetLocale === locale || isPending) return;

    if (currentUser) {
      void api
        .patch("/api/settings/profile", { languagePref: targetLocale })
        .then((res) => {
          if (res.success) {
            void queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
            void queryClient.invalidateQueries({ queryKey: authKeys.me() });
          }
        })
        .catch(() => {
          // Best-effort profile sync; route locale navigation proceeds immediately.
        });
    }

    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const targetHref = `${pathname}${search}${hash}`;

    startTransition(() => {
      router.replace(targetHref, { locale: targetLocale });
    });
  };

  if (variant === "compact") {
    const nextLocale: AppLocale = locale === "fr" ? "en" : "fr";
    return (
      <button
        type="button"
        onClick={() => handleSelectLocale(nextLocale)}
        disabled={isPending}
        aria-label={`${t("switchLanguage")} (${nextLocale.toUpperCase()})`}
        title={t("switchLanguage")}
        className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-60 ${className}`}
      >
        <Globe className="w-3.5 h-3.5 text-portal-primary shrink-0" aria-hidden />
        <span>{locale.toUpperCase()}</span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <div
        role="group"
        aria-label={t("switchLanguage")}
        className={`inline-flex items-center p-0.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md ${className}`}
      >
        {routing.locales.map((itemLocale) => {
          const isActive = itemLocale === locale;
          return (
            <button
              key={itemLocale}
              type="button"
              onClick={() => handleSelectLocale(itemLocale)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? "bg-surface text-on-surface shadow-xs"
                  : "text-surface/75 hover:text-white"
              }`}
            >
              {itemLocale}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("switchLanguage")}
      className={`inline-flex items-center p-1 rounded-full border border-portal-border bg-portal-surface-hover/70 ${className}`}
    >
      {routing.locales.map((itemLocale) => {
        const isActive = itemLocale === locale;
        return (
          <button
            key={itemLocale}
            type="button"
            onClick={() => handleSelectLocale(itemLocale)}
            disabled={isPending}
            aria-pressed={isActive}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isActive
                ? "bg-portal-surface text-portal-primary shadow-xs border border-portal-border"
                : "text-portal-text-muted hover:text-portal-text"
            }`}
          >
            {itemLocale}
          </button>
        );
      })}
    </div>
  );
}
