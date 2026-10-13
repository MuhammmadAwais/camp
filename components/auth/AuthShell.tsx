"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";

interface Props {
  children: React.ReactNode;
}

export function AuthShell({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-white text-gray-900 lg:grid lg:grid-cols-12">
      {/* LEFT COLUMN: Clean White Form Canvas */}
      <div className="lg:col-span-6 xl:col-span-5 flex min-h-screen flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10 bg-white">
        {/* Top Header: Back Link only (logo relocated to image top-right) */}
        <header className="flex items-center justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors group"
            aria-label="Back to AutoNexa website"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
            <span>Back to website</span>
          </Link>
        </header>

        {/* Mobile-only compact visual banner */}
        <div className="lg:hidden my-6">
          <div className="h-40 sm:h-48 rounded-2xl overflow-hidden shadow-sm">
            <AuthVisualPanel variant="compact" />
          </div>
        </div>

        {/* Main Form Center Area */}
        <main className="flex-1 flex flex-col justify-center py-6 sm:py-8 w-full max-w-[420px] mx-auto">
          {children}
        </main>

        {/* Left-Side Footer: Copyright + Privacy, Terms, Support */}
        <footer className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-body text-xs text-gray-400">
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
