'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/lib/store/useSidebarStore';
import { Sidebar } from './Sidebar';
import { MobileMenuButton } from './MobileMenuButton';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();

  // If on landing page or standalone auth pages, render pure children without app shell
  const isExcludedPage =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth');

  if (isExcludedPage) {
    return <>{children}</>;
  }

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen w-full bg-[#080C14] text-white flex flex-col font-body selection:bg-[#008C87] selection:text-white"
    >
      {/* 1. Subtle Ambient Portal Substrate Gradients */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none bg-[radial-gradient(circle_at_85%_15%,rgba(0,140,135,0.08)_0%,transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none bg-[radial-gradient(circle_at_15%_85%,rgba(229,147,68,0.04)_0%,transparent_50%)]"
        aria-hidden="true"
      />

      {/* 2. Floating Mobile Menu Button (lg:hidden) */}
      <MobileMenuButton />

      {/* 3. Persistent Sidebar Navigation */}
      <Sidebar />

      {/* 4. Main Viewport Container (Dynamic Padding for Collapsed / Expanded Rail) */}
      <div
        suppressHydrationWarning
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative z-10 ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        <main className="flex-1 w-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
