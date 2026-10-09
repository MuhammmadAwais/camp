import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* 1. Admin Console Header */}
      <header className="sticky top-0 z-40 w-full bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin/moderation" className="flex items-center gap-2">
            <Image src="/logo.png" alt="AutoNexa" width={24} height={24} className="object-contain" />
            <span className="font-headline font-bold text-base tracking-tight">AutoNexa Ops Console</span>
          </Link>
          <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded uppercase">
            Admin Tier
          </span>
        </div>

        <nav className="flex items-center gap-4 text-xs font-medium text-slate-300">
          <Link href="/admin/moderation" className="hover:text-white transition-colors">
            Moderation Queue
          </Link>
          <Link href="/admin/dealers" className="hover:text-white transition-colors">
            Dealer Licenses
          </Link>
          <Link href="/admin/disputes" className="hover:text-white transition-colors">
            Disputes
          </Link>
        </nav>
      </header>

      {/* 2. Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* 3. Admin Footer */}
      <footer className="w-full py-3 px-6 text-center text-xs text-slate-500 bg-white border-t border-slate-200">
        AutoNexa Internal Operations Desk &bull; Confidential
      </footer>
    </div>
  );
}
