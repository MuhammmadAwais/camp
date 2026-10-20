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
  Car,
  Users,
  ClipboardText,
  Scales,
  FileText,
  CreditCard,
} from '@phosphor-icons/react';
import { useSidebarStore } from '@/lib/store/useSidebarStore';
import { SidebarFlyout, type SubNavItem } from './SidebarFlyout';
import { UserProfileCard } from './UserProfileCard';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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

  // Dynamic Navigation items tailored to active role with ZERO 404s
  const isDealer = role === 'DEALER_ADMIN' || role === 'DEALER_AGENT';
  const isAdmin = role === 'ADMIN';

  let NAV_ITEMS: NavGroup[] = [];

  if (isAdmin) {
    NAV_ITEMS = [
      {
        id: 'admin-moderation',
        title: 'Approvals',
        href: '/admin/moderation',
        icon: ShieldCheck,
        section: 'MODERATION',
        items: [
          { title: 'Vehicle Queue', href: '/admin/moderation' },
          { title: 'Dealer Licenses', href: '/admin/dealers' },
        ],
      },
      {
        id: 'admin-auctions',
        title: 'Marketplace',
        href: '/admin/auctions',
        icon: Gavel,
        section: 'MODERATION',
        items: [
          { title: 'Live Auctions', href: '/admin/auctions' },
          { title: 'Disputes', href: '/admin/disputes' },
        ],
      },
      {
        id: 'admin-analytics',
        title: 'Analytics & Logs',
        href: '/admin/analytics',
        icon: ChartPolar,
        section: 'GOVERNANCE',
        items: [
          { title: 'Market Analytics', href: '/admin/analytics' },
          { title: 'Audit Trail', href: '/admin/audit-log' },
        ],
      },
    ];
  } else if (isDealer) {
    NAV_ITEMS = [
      {
        id: 'dealer-floor',
        title: 'Live Inventory',
        href: '/dealer/inventory',
        icon: House,
        section: 'TRADING FLOOR',
        items: [
          { title: 'Wholesale Floor', href: '/dealer/inventory' },
          { title: 'Vehicle Inspection', href: '/dealer/auctions/auc-porsche-macan-2022' },
        ],
      },
      {
        id: 'dealer-trading',
        title: 'My Bids',
        href: '/dealer/active-bids',
        icon: Gavel,
        section: 'TRADING FLOOR',
        items: [
          { title: 'Active Bids', href: '/dealer/active-bids' },
          { title: 'Won Matches', href: '/dealer/won-matches' },
        ],
      },
      {
        id: 'dealer-account',
        title: 'Dealership',
        href: '/dealer/subscription',
        icon: CreditCard,
        section: 'MANAGEMENT',
        items: [
          { title: 'Subscription Plan', href: '/dealer/subscription' },
          { title: 'Invoices & Billing', href: '/dealer/billing' },
          { title: 'Team Members', href: '/dealer/team' },
        ],
      },
      {
        id: 'dealer-compliance',
        title: 'Legal & Trust',
        href: '/legal/terms',
        icon: ShieldCheck,
        section: 'MANAGEMENT',
        items: [
          { title: 'Dealer License', href: '/dealer/register' },
          { title: 'Terms of Service', href: '/legal/terms' },
          { title: 'Privacy Policy', href: '/legal/privacy' },
        ],
      },
    ];
  } else {
    // Default: Private Seller
    NAV_ITEMS = [
      {
        id: 'seller-dashboard',
        title: 'Dashboard',
        href: '/seller/dashboard',
        icon: House,
        section: 'VEHICLES',
        items: [
          { title: 'Overview', href: '/seller/dashboard' },
          { title: 'Sell a Car', href: '/seller/list-car' },
        ],
      },
      {
        id: 'seller-auctions',
        title: 'Auctions',
        href: '/seller/listings/auc-porsche-macan-2022',
        icon: Gavel,
        section: 'VEHICLES',
        items: [
          { title: 'Live Auction', href: '/seller/listings/auc-porsche-macan-2022' },
          { title: 'Dealer Offers', href: '/seller/listings/auc-porsche-macan-2022/select-dealer' },
          { title: 'Inspection Voucher', href: '/seller/listings/auc-porsche-macan-2022/appointment' },
        ],
      },
      {
        id: 'seller-trust',
        title: 'Account',
        href: '/verify-kyc',
        icon: ShieldCheck,
        section: 'VERIFICATION',
        items: [
          { title: 'ID Verification', href: '/verify-kyc' },
          { title: 'Privacy Policy', href: '/legal/privacy' },
          { title: 'Terms of Service', href: '/legal/terms' },
        ],
      },
    ];
  }

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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-white/10 text-gray-900 dark:text-white transition-all duration-300 ease-in-out font-body w-[280px] sm:w-[290px] ${
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
          {Array.from(new Set(NAV_ITEMS.map((item) => item.section || 'MENU'))).map((sectionKey, sectionIdx) => {
            const sectionItems = NAV_ITEMS.filter(
              (item) => (item.section || 'MENU') === sectionKey
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
                  
                  // Toggle the sidebar first 2 sections into full list view as default
                  const isDefaultOpen = sectionIdx < 2;
                  const isExpanded =
                    expandedGroups[group.id] !== undefined
                      ? expandedGroups[group.id]
                      : isDefaultOpen;
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
                        className={
                          isCollapsed
                            ? 'group/item relative flex items-center justify-center py-2 px-1 cursor-pointer transition-colors'
                            : `group/item flex items-center justify-between rounded-lg px-3 py-2 min-h-[40px] transition-all cursor-pointer ${
                                isMainActive
                                  ? 'bg-neutral-100 dark:bg-white/[0.08] text-neutral-900 dark:text-white font-semibold shadow-xs'
                                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                              }`
                        }
                      >
                        {/* Collapsed Rail Active Left Indicator Bar */}
                        {isCollapsed && isMainActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#8C383E] dark:bg-[#E59344]" />
                        )}

                        {/* Direct Link to Route */}
                        <Link
                          href={group.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 flex-1 overflow-hidden cursor-pointer ${
                            isCollapsed ? 'justify-center' : ''
                          }`}
                        >
                          <Icon
                            className={`size-5 shrink-0 transition-all duration-200 group-hover/item:scale-105 ${
                              isMainActive
                                ? 'text-[#8C383E] dark:text-[#E59344]'
                                : 'text-neutral-400 group-hover/item:text-neutral-700 dark:text-neutral-500 dark:group-hover/item:text-neutral-300'
                            }`}
                            weight={isMainActive ? 'duotone' : 'regular'}
                          />
                          {!isCollapsed && (
                            <span className="text-xs tracking-tight truncate">
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
                              toggleGroup(group.id, !isExpanded);
                            }}
                            className="size-6 rounded-md flex items-center justify-center hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-white transition-all cursor-pointer shrink-0 ml-1"
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
                        <div className="relative ml-5 pl-3 border-l border-neutral-200 dark:border-white/10 my-1 flex flex-col gap-0.5 animate-in fade-in duration-150">
                          {group.items.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={closeMobile}
                                className={`relative text-xs px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-between group/sub ${
                                  isSubActive
                                    ? 'text-[#8C383E] dark:text-[#E59344] font-semibold bg-[#8C383E]/5 dark:bg-[#E59344]/10'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                                }`}
                              >
                                {/* Guide line connector notch */}
                                <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-2 h-[1px] bg-neutral-200 dark:border-white/10 group-hover/sub:bg-[#8C383E]/40 dark:group-hover/sub:bg-[#E59344]/40 transition-colors" />

                                <span className="truncate">{sub.title}</span>
                                {isSubActive && (
                                  <span className="size-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344]" />
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

        {/* Theme Toggle section: positioned just above profile divider */}
        <div className={`px-3 py-2 border-t border-gray-200 dark:border-white/10 flex items-center shrink-0 justify-center`}>
         
          <ThemeToggle variant={isCollapsed ? 'compact' : 'segmented'} />
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-gray-200 dark:border-white/10 shrink-0 bg-gray-50/80 dark:bg-[#0A0A0A]">
          <UserProfileCard isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
