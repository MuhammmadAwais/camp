"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gavel,
  ShieldCheck,
  Building2,
  TrendingUp,
  Layers,
  Clock,
  Sparkles,
  Award,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function DealerHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-portal-border bg-portal-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Exchange Title */}
        <div className="flex items-center gap-6">
          <Link href="/dealer/inventory" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-portal-primary/10 text-portal-primary flex items-center justify-center border border-portal-primary/25 group-hover:scale-105 transition-transform">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-base font-bold text-portal-text tracking-tight">AutoNexa</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-portal-primary text-white">
                  Wholesale
                </span>
              </div>
              <span className="text-[10px] text-portal-text-muted block font-mono">
                Canadian Dealer Exchange
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/dealer/inventory"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/dealer/inventory"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              Trading Floor
            </Link>
            <Link
              href="/dealer/active-bids"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/dealer/active-bids"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              Active Bids
            </Link>
            <Link
              href="/dealer/won-matches"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/dealer/won-matches"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              Won Matches
            </Link>
            <Link
              href="/admin/moderation"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              Admin Center
            </Link>
            <Link
              href="/seller/dashboard"
              className="px-3 py-1.5 rounded-lg text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60 transition-colors"
            >
              Seller Portal
            </Link>
          </nav>
        </div>

        {/* Right Dealership Profile & Quota Widget */}
        <div className="flex items-center gap-3">
          {/* Monthly Bid Quota Gauge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs font-mono">
            <span className="text-portal-text-muted text-[11px]">Monthly Quota:</span>
            <span className="font-bold text-portal-primary">14 / 50 Used</span>
          </div>

          {/* Dealership Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs">
            <Building2 className="w-4 h-4 text-portal-primary shrink-0" />
            <div className="hidden sm:block text-left">
              <span className="font-semibold text-portal-text block text-[11px] leading-tight">
                Pfaff Porsche
              </span>
              <span className="text-[10px] text-portal-text-muted font-mono block">
                OMVIC-481920
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle variant="compact" />
        </div>
      </div>
    </header>
  );
}
