import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-portal-dark-canvas text-portal-dark-text flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. High-Density Dark Trading Terminal Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0B101D]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dealer/inventory" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center p-1.5">
              <Image src="/logo.png" alt="AutoNexa" width={22} height={22} className="object-contain" />
            </div>
            <span className="font-headline font-bold text-base text-white tracking-tight">
              Auto<span className="text-emerald-400">Nexa</span> <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono font-normal">Terminal</span>
            </span>
          </Link>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE WHOLESALE FEED
          </span>
        </div>

        {/* 2. Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-6 text-xs font-medium text-neutral-400">
          <Link
            href="/dealer/inventory"
            className="text-white hover:text-emerald-400 transition-colors py-1.5 px-2.5 rounded-lg bg-white/5 border border-white/10"
          >
            Inventory Feed
          </Link>
          <Link
            href="/dealer/active-bids"
            className="hover:text-white transition-colors py-1.5 px-2"
          >
            Active Bids
          </Link>
          <Link
            href="/dealer/won-matches"
            className="hover:text-white transition-colors py-1.5 px-2"
          >
            Won Matches
          </Link>
        </nav>
      </header>

      {/* 3. Terminal Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* 4. Terminal Telemetry Footer */}
      <footer className="w-full py-3.5 px-6 border-t border-white/5 text-[11px] font-mono text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>OMVIC &bull; AMVIC &bull; VSA Certified Dealer Terminal</div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">● 12ms Telemetry</span>
          <span>Sealed Bids AES-256</span>
        </div>
      </footer>
    </div>
  );
}
