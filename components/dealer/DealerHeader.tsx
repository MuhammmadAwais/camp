"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function DealerHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-portal-border bg-portal-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Exchange Title */}
        <div className="flex items-center gap-6">
          <Link href="/dealer/inventory" className="flex items-center gap-2.5 group" aria-label="AutoNexa Dealer Floor">
            <span className="relative w-9 h-5">
              <Image src="/logo-mark.webp" alt="" fill sizes="36px" className="object-contain" />
            </span>
            <div className="flex items-center gap-2">
              <span className="font-headline text-base font-bold text-portal-text tracking-tight">AutoNexa</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                Dealer
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
              Inventory
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
              Won Auctions
            </Link>
          </nav>
        </div>

        {/* Right Dealership Profile & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Dealership Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-portal-surface-hover border border-portal-border text-xs shadow-2xs">
            <Building2 className="w-4 h-4 text-portal-primary shrink-0" />
            <div className="text-left">
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
