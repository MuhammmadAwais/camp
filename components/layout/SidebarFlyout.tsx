'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SubNavItem {
  title: string;
  href: string;
}

interface SidebarFlyoutProps {
  title: string;
  mainHref: string;
  items: SubNavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarFlyout({
  title,
  mainHref,
  items,
  isOpen,
  onClose,
}: SidebarFlyoutProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute left-full top-0 ml-3 z-50 min-w-[210px] rounded-xl p-2 bg-white/98 dark:bg-[#131215]/95 backdrop-blur-2xl border border-gray-200 dark:border-white/15 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-150 select-none font-body"
    >
      {/* Header Link */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
        <Link
          href={mainHref}
          onClick={onClose}
          className="text-xs font-bold text-gray-900 dark:text-white hover:text-[#8C383E] dark:hover:text-[#E59344] transition-colors flex items-center justify-between cursor-pointer group"
        >
          <span>{title}</span>
          <span className="text-[10px] text-gray-400 dark:text-neutral-400 group-hover:text-[#8C383E] dark:group-hover:text-[#E59344] font-normal">
            View All →
          </span>
        </Link>
      </div>

      {/* Sub-item List */}
      <div className="flex flex-col gap-0.5">
        {items.map((sub) => {
          const isActive = pathname === sub.href;
          return (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={onClose}
              className={`text-xs px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                isActive
                  ? 'bg-[#8C383E]/10 text-[#8C383E] border border-[#8C383E]/20 dark:bg-[#E59344]/15 dark:text-[#E59344] dark:border-[#E59344]/30 font-semibold'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/[0.06]'
              }`}
            >
              <span>{sub.title}</span>
              {isActive && (
                <span className="size-1.5 rounded-full bg-[#8C383E] dark:bg-[#E59344] shadow-[0_0_6px_#8C383E] dark:shadow-[0_0_8px_#E59344]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
