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
      className="absolute left-full top-0 ml-2.5 z-50 min-w-[210px] rounded-2xl p-2 bg-[#131215]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_1px_1px_rgba(255,255,255,0.08)] animate-in fade-in zoom-in-95 duration-150 select-none font-body"
    >
      {/* Header Link */}
      <div className="px-3 py-2 border-b border-white/10 mb-1">
        <Link
          href={mainHref}
          onClick={onClose}
          className="text-xs font-bold text-white hover:text-[#008C87] transition-colors flex items-center justify-between cursor-pointer group"
        >
          <span>{title}</span>
          <span className="text-[10px] text-neutral-400 group-hover:text-[#008C87] font-normal">
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
              className={`text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                isActive
                  ? 'bg-[#008C87]/15 text-[#008C87] font-semibold border border-[#008C87]/30'
                  : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span>{sub.title}</span>
              {isActive && (
                <span className="size-1.5 rounded-full bg-[#008C87] shadow-[0_0_8px_#008C87]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
