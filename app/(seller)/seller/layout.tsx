import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text flex flex-col antialiased">
      {/* 1. Seller Portal Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-portal-border px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/seller/dashboard" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="AutoNexa" width={26} height={26} className="object-contain" />
            <span className="font-headline font-bold text-base text-slate-900 tracking-tight">
              Auto<span className="text-emerald-600">Nexa</span>
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Seller Portal
          </span>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
          <Link
            href="/seller/dashboard"
            className="text-slate-700 hover:text-emerald-700 transition-colors font-semibold"
          >
            Dashboard
          </Link>
          <Link
            href="/seller/list-car"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-xs"
          >
            + New Listing
          </Link>
        </nav>
      </header>

      {/* 2. Main Portal Content Slot */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* 3. Subtle Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-portal-border/60">
        AutoNexa Seller Portal &bull; Canada Wholesale Reverse Auction Network
      </footer>
    </div>
  );
}
