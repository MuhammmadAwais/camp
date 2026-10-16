'use client';

import React from 'react';
import { List } from '@phosphor-icons/react';
import { useSidebarStore } from '@/lib/store/useSidebarStore';

export function MobileMenuButton() {
  const { toggleMobile } = useSidebarStore();

  return (
    <button
      type="button"
      onClick={toggleMobile}
      className="fixed top-4 left-4 z-40 lg:hidden min-w-[44px] min-h-[44px] rounded-xl bg-white/90 dark:bg-[#131215]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 hover:bg-neutral-100 dark:hover:bg-[#1a191f]"
      aria-label="Open navigation menu"
      title="Open Menu"
    >
      <List className="size-5" weight="bold" />
    </button>
  );
}
