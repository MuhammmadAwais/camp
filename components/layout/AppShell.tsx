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

  // The portal sidebar & dual-theme shell activates for authenticated portal routes
  const isPortalRoute =
    pathname.startsWith('/seller') ||
    pathname.startsWith('/dealer') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/legal');

  const isWebApp =
    isPortalRoute ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/legal') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  React.useEffect(() => {
    if (isWebApp) {
      document.documentElement.setAttribute('data-app-theme', 'webapp');
    } else {
      document.documentElement.setAttribute('data-app-theme', 'landing');
    }
  }, [isWebApp]);

  if (!isPortalRoute) {
    return <>{children}</>;
  }

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen w-full bg-portal-canvas text-portal-text transition-colors duration-200 flex flex-col font-body selection:bg-[#8C383E] selection:text-white dark:selection:bg-[#E59344] dark:selection:text-[#0C0A09]"
    >
      {/* 1. Floating Mobile Menu Button (lg:hidden) */}
      <MobileMenuButton />

      {/* 2. Persistent Sidebar Navigation */}
      <Sidebar />

      {/* 4. Main Viewport Container */}
      <div
        suppressHydrationWarning
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative z-10 ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        <main className="flex-1 w-full flex flex-col px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-8 pb-12 overflow-x-clip">
          {children}
        </main>
      </div>
    </div>
  );
}
