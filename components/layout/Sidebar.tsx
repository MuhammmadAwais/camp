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

      {/* 2. Main Sidebar Aside (Exact Zentris UX Replication) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#131215]/95 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 ease-in-out font-body ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Brand Lockup & Integrated Desktop Collapse Trigger */}
        <div
          className={`h-20 flex items-center border-b border-white/10 shrink-0 transition-all duration-300 relative ${
            isCollapsed ? 'justify-center px-0' : 'justify-between px-5'
          }`}
        >
          <Link
            href="/"
            onClick={closeMobile}
            className="flex items-center gap-3 cursor-pointer group focus:outline-none select-none"
            aria-label="AutoNexa Home"
          >
            {isCollapsed ? (
              <div className="relative w-9 h-5 flex items-center justify-center">
                <Image
                  src="/logo-mark-tight.webp"
                  alt="AutoNexa Logo"
                  fill
                  priority
                  className="object-contain select-none group-hover:scale-105 transition-transform duration-200"
                />
              </div>
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
                <span className="font-headline font-bold text-lg text-white tracking-tight leading-none">
                  Auto<span className="text-[#E59344]">Nexa</span>
                </span>
              </div>
            )}
          </Link>

          {/* Integrated Desktop Toggle Trigger */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex size-7 rounded-lg items-center justify-center bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Collapse sidebar rail"
              aria-label="Collapse sidebar rail"
            >
              <SidebarSimple className="size-4" weight="bold" />
            </button>
          )}

          {/* Collapsed Edge Expansion Notch Trigger */}
          {isCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-[#1b1a1f] hover:bg-[#008C87] border border-white/15 hover:border-[#008C87] text-neutral-400 hover:text-white items-center justify-center transition-all cursor-pointer shadow-md z-50 group"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <CaretRight className="size-3 group-hover:translate-x-0.5 transition-transform" weight="bold" />
            </button>
          )}
        </div>

        {/* Navigation Stream */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-none">
          {['PORTAL', 'TRANSACTIONS', 'COMPLIANCE', 'PREFERENCES'].map((sectionKey) => {
            const sectionItems = NAV_ITEMS.filter(
              (item) => item.section === sectionKey
            );
            if (sectionItems.length === 0) return null;

            return (
              <div key={sectionKey} className="space-y-1">
                {/* Section Header (Expanded Mode Only) */}
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold select-none">
                    {sectionKey}
                  </div>
                )}

                {/* Section Divider (Collapsed Mode Only) */}
                {isCollapsed && (
                  <div className="my-2 border-t border-white/[0.08] mx-2" />
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
                            ? 'bg-[#008C87]/15 text-[#008C87] border border-[#008C87]/30 shadow-xs'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
                        } ${isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'}`}
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
                              isMainActive ? 'text-[#008C87]' : 'text-neutral-400'
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
                            className="size-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer shrink-0 ml-1"
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

                      {/* Sub-Navigation Tree (Expanded Mode Only - Exact Zentris Structure) */}
                      {!isCollapsed && hasSubItems && isExpanded && (
                        <div className="relative ml-5 pl-3.5 border-l border-white/[0.08] my-1 flex flex-col gap-0.5 animate-in fade-in duration-150">
                          {group.items.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={closeMobile}
                                className={`relative text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-between group/sub ${
                                  isSubActive
                                    ? 'bg-white/[0.08] text-[#008C87] font-medium'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                                }`}
                              >
                                {/* Guide line connector notch */}
                                <span className="absolute -left-[15px] top-1/2 -translate-y-1/2 w-2.5 h-[1px] bg-white/[0.08] group-hover/sub:bg-[#008C87]/40 transition-colors" />

                                <span className="truncate">{sub.title}</span>
                                {isSubActive && (
                                  <span className="size-1 rounded-full bg-[#008C87] shadow-[0_0_6px_#008C87]" />
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
        <div className="p-3 border-t border-white/10 shrink-0 bg-[#0f0e12]/60">
          <UserProfileCard isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
