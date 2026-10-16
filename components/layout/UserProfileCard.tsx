'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CaretUpDown, User as UserIcon, GearSix, SignOut, ShieldCheck, Swap } from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth-context';

interface UserProfileCardProps {
  isCollapsed: boolean;
}

export function UserProfileCard({ isCollapsed }: UserProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, role, logout, devSwitchRole } = useAuth();

  const isDealer = role === 'DEALER_ADMIN' || role === 'DEALER_AGENT';
  const displayName = user?.name || (isDealer ? 'Licensed Dealer' : 'Verified Seller');
  const userEmail = user?.email || (isDealer ? 'dealer@autonexa.ca' : 'seller@autonexa.ca');

  // Role tag label
  const roleLabel =
    role === 'ADMIN'
      ? 'Platform Admin'
      : isDealer
      ? 'OMVIC / AMVIC Dealer'
      : 'Private Seller';

  // Close popup menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full font-body select-none">
      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mb-2 rounded-2xl p-2 bg-white dark:bg-[#131215]/95 backdrop-blur-2xl border border-gray-200 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-150 ${
            isCollapsed
              ? 'left-full bottom-0 ml-2.5 min-w-[240px]'
              : 'bottom-full left-0 w-full mb-2'
          }`}
        >
          {/* User Header in Menu */}
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-white/10 mb-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-[#8C383E]/15 text-[#8C383E] border border-[#8C383E]/30 dark:bg-[#E59344]/20 dark:text-[#E59344] dark:border-[#E59344]/30">
                {role || 'USER'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">{userEmail}</p>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-0.5">
            <Link
              href="/settings/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:text-black hover:bg-gray-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            >
              <UserIcon className="size-4 text-gray-400 dark:text-neutral-400" weight="regular" />
              <span>Profile & Verification</span>
            </Link>

            <Link
              href="/settings/security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:text-black hover:bg-gray-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            >
              <GearSix className="size-4 text-gray-400 dark:text-neutral-400" weight="regular" />
              <span>Account Settings</span>
            </Link>

            {/* Quick Role Switcher for dev demo */}
            <div className="my-1 border-t border-gray-200 dark:border-white/10 pt-1">
              <div className="px-3 py-1 text-[10px] font-mono text-gray-400 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Swap className="size-3" />
                <span>Switch Portal Mode</span>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1">
                <button
                  type="button"
                  onClick={async () => {
                    await devSwitchRole('SELLER');
                    setIsOpen(false);
                  }}
                  className={`text-[11px] py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                    role === 'SELLER'
                      ? 'bg-[#8C383E]/15 text-[#8C383E] font-semibold border border-[#8C383E]/30 dark:bg-[#E59344]/20 dark:text-[#E59344] dark:border-[#E59344]/40'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-black dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  Seller
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await devSwitchRole('DEALER_ADMIN');
                    setIsOpen(false);
                  }}
                  className={`text-[11px] py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                    isDealer
                      ? 'bg-[#8C383E]/15 text-[#8C383E] font-semibold border border-[#8C383E]/30 dark:bg-[#E59344]/20 dark:text-[#E59344] dark:border-[#E59344]/40'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-black dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  Dealer
                </button>
              </div>
            </div>

            <div className="my-1 border-t border-gray-200 dark:border-white/10" />

            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <SignOut className="size-4 text-rose-500 dark:text-rose-400" weight="bold" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
          isCollapsed
            ? 'p-2 justify-center hover:bg-gray-100 dark:hover:bg-white/5'
            : 'p-2 justify-between hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
        }`}
        aria-label="User account menu"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Avatar Icon */}
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#8C383E]/30 to-[#E59344]/30 border border-black/10 dark:border-white/15 flex items-center justify-center shrink-0 text-gray-900 dark:text-white font-bold text-xs shadow-inner">
            {displayName.charAt(0).toUpperCase()}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold text-gray-900 dark:text-white tracking-tight truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-neutral-400 truncate">
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <CaretUpDown className="size-4 text-gray-400 dark:text-neutral-400 shrink-0 ml-1" weight="bold" />
        )}
      </button>
    </div>
  );
}
