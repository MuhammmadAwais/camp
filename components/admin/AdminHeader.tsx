"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Gavel,
  CheckSquare,
  BarChart3,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Building,
  UserCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-portal-border bg-portal-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Exchange Title */}
        <div className="flex items-center gap-6">
          <Link href="/admin/moderation" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/25 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-base font-bold text-portal-text tracking-tight">
                  AutoNexa
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white font-mono">
                  Super Admin
                </span>
              </div>
              <span className="text-[10px] text-portal-text-muted block font-mono">
                Marketplace Compliance & Ops
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/admin/moderation"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/admin/moderation"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Moderation Queue</span>
            </Link>
            <Link
              href="/admin/auctions"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/admin/auctions"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Auction Overrides</span>
            </Link>
            <Link
              href="/admin/dealers"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/admin/dealers"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Dealer Licenses</span>
            </Link>
            <Link
              href="/admin/disputes"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/admin/disputes"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Disputes</span>
            </Link>
            <Link
              href="/admin/analytics"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/admin/analytics"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </Link>
            <Link
              href="/admin/audit-log"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === "/admin/audit-log"
                  ? "bg-portal-surface-hover text-portal-primary font-semibold"
                  : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </Link>
          </nav>
        </div>

        {/* Right Admin Profile & Portal Switchers */}
        <div className="flex items-center gap-3">
          {/* Quick Deep Links to Portals */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono">
            <Link
              href="/dealer/inventory"
              className="px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text transition-colors flex items-center gap-1"
            >
              <Gavel className="w-3 h-3 text-portal-primary" />
              <span>Dealer Floor</span>
            </Link>
            <Link
              href="/seller/dashboard"
              className="px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text-muted hover:text-portal-text transition-colors flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-portal-primary" />
              <span>Seller App</span>
            </Link>
          </div>

          {/* Admin Officer Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-portal-surface-hover border border-portal-border text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="hidden sm:block text-left">
              <span className="font-semibold text-portal-text block text-[11px] leading-tight">
                Sarah Tremblay
              </span>
              <span className="text-[10px] text-portal-text-muted font-mono block">
                Lead Compliance Officer
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
