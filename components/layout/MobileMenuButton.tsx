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
      className="fixed top-4 left-4 z-40 lg:hidden size-10 rounded-xl bg-[#131215]/85 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 hover:bg-[#1a191f]"
      aria-label="Open navigation menu"
      title="Open Menu"
    >
      <List className="size-5" weight="bold" />
    </button>
  );
}
