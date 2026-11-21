"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface px-4">
      <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border-card bg-surface-container-lowest p-8 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
          404
        </p>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          {t("title")}
        </h1>
        <p className="font-body text-sm text-on-surface-variant">
          {t("description")}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            {t("returnHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
