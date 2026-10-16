"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";

interface Props {
  children: React.ReactNode;
}

export function AuthShell({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-white text-gray-900 lg:grid lg:grid-cols-12 selection:bg-[#008C87] selection:text-white">
      {/* LEFT COLUMN: Clean White Form Canvas */}
      <div className="lg:col-span-6 xl:col-span-5 flex min-h-screen flex-col justify-between px-4 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10 bg-white">
        {/* Top Header: Back Link + Mobile-Visible Logo */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors group py-1"
            aria-label="Back to AutoNexa website"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
            <span>Back to website</span>
          </Link>

          {/* Mobile-only logo lockup */}
          <Link href="/" className="lg:hidden flex items-center gap-2" aria-label="AutoNexa home">
            <div className="relative w-7 h-4 shrink-0">
              <Image src="/logo-mark-tight.png" alt="AutoNexa Emblem" fill sizes="28px" className="object-contain" priority />
            </div>
            <span className="font-headline font-bold text-base text-gray-900 tracking-tight">
              Auto<span className="text-[#008C87]">Nexa</span>
            </span>
          </Link>
        </header>

        {/* Mobile-only compact visual banner (< 1024px) */}
        <div className="lg:hidden my-4 sm:my-6">
          <div className="h-32 sm:h-40 rounded-2xl overflow-hidden shadow-xs border border-gray-100">
            <AuthVisualPanel variant="compact" />
          </div>
        </div>

        {/* Main Form Center Area */}
        <main className="flex-1 flex flex-col justify-center py-4 sm:py-6 lg:py-8 w-full max-w-[420px] mx-auto">
          {children}
        </main>

        {/* Left-Side Footer: Copyright + Legal Links */}
        <footer className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-y-3 gap-x-4 font-body text-xs text-gray-400 text-center sm:text-left">
          <span>© {new Date().getFullYear()} AutoNexa Inc.</span>
          <div className="flex items-center gap-4 text-xs font-body">
            <Link href="/legal/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-gray-700 transition-colors">Terms of Use</Link>
            <a href="mailto:support@autonexa.ca" className="hover:text-gray-700 transition-colors">Support</a>
          </div>
        </footer>
      </div>

      {/* RIGHT COLUMN: High-impact Visual Panel with signature rounded-bl-[100px] */}
      <aside className="hidden lg:block lg:col-span-6 xl:col-span-7 sticky top-0 h-screen w-full bg-white pl-0">
        <AuthVisualPanel variant="full" />
      </aside>
    </div>
  );
}
