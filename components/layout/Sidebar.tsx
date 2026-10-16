'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  House,
  Gavel,
  CurrencyCircleDollar,
  ChartPolar,
  ShieldCheck,
  GearSix,
  CaretDown,
  CaretRight,
  CaretLeft,
  SidebarSimple,
  X,
} from '@phosphor-icons/react';
import { useSidebarStore } from '@/lib/store/useSidebarStore';
import { SidebarFlyout, type SubNavItem } from './SidebarFlyout';
import { UserProfileCard } from './UserProfileCard';
import { useAuth } from '@/lib/auth-context';

interface NavGroup {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string; weight?: 'regular' | 'duotone' | 'fill' | 'bold' }>;
  section?: string;
  items: SubNavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobile, toggleSidebar, expandedGroups, toggleGroup } =
    useSidebarStore();

  // Active flyout in collapsed rail mode
  const [activeFlyoutId, setActiveFlyoutId] = useState<string | null>(null);

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeMobile]);

  // Dynamic Navigation items tailored to AutoNexa Canadian Marketplace
  const isDealer = role === 'DEALER_ADMIN' || role === 'DEALER_AGENT';
  const dashboardHref = isDealer ? '/dealer/inventory' : '/seller/dashboard';
  const listingsHref = isDealer ? '/dealer/live-auctions' : '/seller/listings';
  const bidsHref = isDealer ? '/dealer/my-bids' : '/seller/bids';

  const NAV_ITEMS: NavGroup[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      href: dashboardHref,
      icon: House,
      section: 'PORTAL',
      items: [
        { title: 'Overview', href: dashboardHref },
        { title: 'Live Activity', href: `${dashboardHref}/activity` },
      ],
    },
    {
      id: 'vehicles',
      title: isDealer ? 'Live Inventory' : 'My Vehicles',
      href: listingsHref,
      icon: Gavel,
      section: 'PORTAL',
      items: [
        { title: 'Active Exchange', href: listingsHref },
        { title: 'Vehicle History', href: `${listingsHref}/history` },
      ],
    },
    {
      id: 'bids',
      title: 'Bids & Offers',
      href: bidsHref,
      icon: CurrencyCircleDollar,
      section: 'TRANSACTIONS',
      items: [
        { title: 'Sealed Bids', href: bidsHref },
        { title: 'Settlement Payouts', href: `${bidsHref}/settlements` },
      ],
    },
    {
      id: 'valuations',
      title: 'Market Intelligence',
      href: '/valuation',
      icon: ChartPolar,
      section: 'TRANSACTIONS',
      items: [
        { title: 'Real-time Valuation', href: '/valuation' },
        { title: 'Depreciation Curves', href: '/valuation/analytics' },
      ],
    },
    {
      id: 'compliance',
      title: 'Verification & Trust',
      href: isDealer ? '/dealer/verification' : '/seller/kyc',
      icon: ShieldCheck,
      section: 'COMPLIANCE',
      items: [
        { title: 'ID Verification', href: isDealer ? '/dealer/verification' : '/seller/kyc' },
        { title: 'Regulatory Compliance', href: '/legal/terms' },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      href: '/settings/account',
      icon: GearSix,
      section: 'PREFERENCES',
      items: [
        { title: 'Account Settings', href: '/settings/account' },
        { title: 'Notifications', href: '/settings/notifications' },
      ],
    },
  ];

  return (
    <>
      {/* 1. Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm lg:hidden transition-opacity duration-200"
        />
      )}

      {/* 2. Main Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/95 dark:bg-[#131215]/95 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10 text-gray-900 dark:text-white transition-all duration-300 ease-in-out font-body w-[280px] sm:w-[290px] ${
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Brand Lockup, Mobile Close Button & Integrated Desktop Collapse Trigger */}
        <div
          className={`h-20 flex items-center border-b border-gray-200 dark:border-white/10 shrink-0 transition-all duration-300 relative justify-between px-5 ${
            isCollapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-between lg:px-5'
          }`}
        >
          <Link
            href="/"
            onClick={closeMobile}
            className="flex items-center gap-3 cursor-pointer group focus:outline-none select-none"
            aria-label="AutoNexa Home"
          >
            {isCollapsed ? (
              <>
                <div className="hidden lg:flex relative w-9 h-5 items-center justify-center">
                  <Image
                    src="/logo-mark-tight.webp"
                    alt="AutoNexa Logo"
                    fill
                    priority
                    className="object-contain select-none group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex lg:hidden items-center gap-2.5">
                  <div className="relative w-8 h-[18px] shrink-0">
                    <Image
                      src="/logo-mark-tight.webp"
                      alt="AutoNexa Emblem"
                      fill
                      priority
                      className="object-contain select-none"
                    />
                  </div>
                  <span className="font-headline font-bold text-lg text-gray-900 dark:text-white tracking-tight leading-none">
                    Auto<span className="text-[#8C383E] dark:text-[#E59344]">Nexa</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-[18px] shrink-0">
                  <Image
                    src="/logo-mark-tight.webp"
                    alt="AutoNexa Emblem"
                    fill
                    priority
                    className="object-contain select-none"
                  />
                </div>
                <span className="font-headline font-bold text-lg text-gray-900 dark:text-white tracking-tight leading-none">
                  Auto<span className="text-[#8C383E] dark:text-[#E59344]">Nexa</span>
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Dedicated Close Button */}
          <button
            type="button"
            onClick={closeMobile}
            className="lg:hidden size-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="size-5" weight="bold" />
          </button>

          {/* Integrated Desktop Toggle Trigger */}
          {/* Integrated Desktop Toggle Trigger (Expanded Mode) */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex size-7 rounded-lg items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.12] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-all cursor-pointer shadow-xs"
              title="Collapse sidebar rail"
              aria-label="Collapse sidebar rail"
            >
              <SidebarSimple className="size-4" weight="bold" />
            </button>
          )}
        </div>

        {/* Navigation Stream */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-none">
          {/* Collapsed In-Rail Toggle Trigger (Clean bars placed above Home icon, matching reference) */}
          {isCollapsed && (
            <div className="hidden lg:flex flex-col items-center pt-1 pb-1">
              <button
                type="button"
                onClick={toggleSidebar}
                className="size-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer group"
                title="Expand full sidebar"
                aria-label="Expand full sidebar"
              >
                {/* Clean two horizontal bars (=) matching reference image */}
                <svg
                  className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="7.5" x2="16" y2="7.5" />
                  <line x1="4" y1="12.5" x2="16" y2="12.5" />
                </svg>
              </button>
              <div className="w-8 border-t border-gray-200 dark:border-white/[0.08] mt-2.5" />
            </div>
          )}
          {['PORTAL', 'TRANSACTIONS', 'COMPLIANCE', 'PREFERENCES'].map((sectionKey) => {
            const sectionItems = NAV_ITEMS.filter(
              (item) => item.section === sectionKey
            );
            if (sectionItems.length === 0) return null;

            return (
              <div key={sectionKey} className="space-y-1">
                {/* Section Header (Expanded Mode Only) */}
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-neutral-400 font-semibold select-none">
                    {sectionKey}
                  </div>
                )}

             

                {/* Section Nav Items */}
                {sectionItems.map((group) => {
                  const Icon = group.icon;
                  const isMainActive =
                    pathname === group.href ||
                    (group.href !== '/' && pathname.startsWith(group.href));
                  const isExpanded = !!expandedGroups[group.id];
                  const hasSubItems = group.items.length > 0;

                  return (
                    <div
                      key={group.id}
                      className="relative"
                      onMouseEnter={() => {
                        if (isCollapsed) setActiveFlyoutId(group.id);
                      }}
                      onMouseLeave={() => {
                        if (isCollapsed) setActiveFlyoutId(null);
                      }}
                    >
                      {/* Main Navigation Item */}
                      <div
                        className={`group/item flex items-center justify-between rounded-xl transition-all cursor-pointer ${
                          isMainActive
                            ? 'bg-[#8C383E]/10 text-[#8C383E] border border-[#8C383E]/25 dark:bg-[#E59344]/15 dark:text-[#E59344] dark:border-[#E59344]/30 shadow-xs'
                            : 'text-gray-700 hover:text-black hover:bg-gray-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/[0.05]'
                        } ${isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5 min-h-[44px]'}`}
                      >
                        {/* Direct Link to Route */}
                        <Link
                          href={group.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 flex-1 overflow-hidden cursor-pointer ${
                            isCollapsed ? 'justify-center' : ''
                          }`}
                        >
                          <Icon
                            className={`size-5 shrink-0 transition-transform group-hover/item:scale-105 ${
                              isMainActive ? 'text-[#8C383E] dark:text-[#E59344]' : 'text-gray-400 dark:text-neutral-400'
                            }`}
                            weight={isMainActive ? 'duotone' : 'regular'}
                          />
                          {!isCollapsed && (
                            <span className="text-xs font-semibold tracking-tight truncate">
                              {group.title}
                            </span>
                          )}
                        </Link>

                        {/* Chevron Expand Trigger (Expanded Mode Only) */}
                        {!isCollapsed && hasSubItems && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleGroup(group.id);
                            }}
                            className="size-6 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-all cursor-pointer shrink-0 ml-1"
                            aria-label={`Toggle ${group.title} sub-menu`}
                          >
                            {isExpanded ? (
                              <CaretDown className="size-3.5" weight="bold" />
                            ) : (
                              <CaretRight className="size-3.5" weight="bold" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Sub-Navigation Tree (Expanded Mode Only) */}
                      {!isCollapsed && hasSubItems && isExpanded && (
                        <div className="relative ml-5 pl-3.5 border-l border-gray-200 dark:border-white/[0.08] my-1 flex flex-col gap-0.5 animate-in fade-in duration-150">
                          {group.items.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={closeMobile}
                                className={`relative text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-between group/sub ${
                                  isSubActive
                                    ? 'bg-[#8C383E]/10 text-[#8C383E] dark:bg-white/[0.08] dark:text-[#E59344] font-medium'
                                    : 'text-gray-600 hover:text-black hover:bg-gray-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                              >
                                {/* Guide line connector notch */}
                                <span className="absolute -left-[15px] top-1/2 -translate-y-1/2 w-2.5 h-[1px] bg-gray-200 dark:bg-white/[0.08] group-hover/sub:bg-[#8C383E]/40 dark:group-hover/sub:bg-[#E59344]/40 transition-colors" />

                                <span className="truncate">{sub.title}</span>
                                {isSubActive && (
                                  <span className="size-1 rounded-full bg-[#8C383E] shadow-[0_0_6px_#8C383E] dark:bg-[#E59344] dark:shadow-[0_0_6px_#E59344]" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Floating Popover Flyout (Collapsed Mode Only) */}
                      {isCollapsed && hasSubItems && (
                        <SidebarFlyout
                          title={group.title}
                          mainHref={group.href}
                          items={group.items}
                          isOpen={activeFlyoutId === group.id}
                          onClose={() => setActiveFlyoutId(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-gray-200 dark:border-white/10 shrink-0 bg-gray-50/80 dark:bg-[#0f0e12]/60">
          <UserProfileCard isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
