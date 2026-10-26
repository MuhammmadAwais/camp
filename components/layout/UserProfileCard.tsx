'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  CaretUpDown,
  User as UserIcon,
  GearSix,
  SignOut,
  ShieldCheck,
  Swap,
  CheckCircle,
  FileText,
  LockKey,
} from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth-context';

interface UserProfileCardProps {
  isCollapsed: boolean;
}

export function UserProfileCard({ isCollapsed }: UserProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, role, logout, devSwitchRole } = useAuth();

  const isDealer = role === 'DEALER_ADMIN' || role === 'DEALER_AGENT';
  const isAdmin = role === 'ADMIN';

  const displayName =
    user?.name ||
    (isAdmin
      ? 'Sarah Tremblay'
      : isDealer
      ? 'Pfaff Automotive Partner'
      : 'Michael Vance');

  const userEmail =
    user?.email ||
    (isAdmin
      ? 'admin@autonexa.ca'
      : isDealer
      ? 'trading@pfaffauto.ca'
      : 'm.vance@rogers.ca');

  const roleTitle =
    isAdmin
      ? 'Lead Compliance Officer'
      : isDealer
      ? 'OMVIC Verified Dealer'
      : 'Verified Private Seller';

  const roleBadgeLabel =
    isAdmin ? 'ADMIN' : isDealer ? 'DEALER' : 'SELLER';

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
      {/* Popover Dropdown Menu (Classic Professional SaaS Architecture) */}
      {isOpen && (
        <div
          className={`absolute z-50 rounded-2xl p-3 bg-portal-surface/98 backdrop-blur-2xl border border-portal-border shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
            isCollapsed
              ? 'left-full bottom-0 ml-3 w-72'
              : 'bottom-full left-0 w-full sm:w-80 mb-2'
          }`}
        >
          {/* 1. Header Profile Card */}
          <div className="pb-3 border-b border-portal-border/60">
            <div className="flex items-center gap-3">
              {/* Avatar Monogram */}
              <div className="relative size-10 rounded-xl bg-gradient-to-br from-[#8C383E]/20 to-[#E59344]/30 border border-portal-border flex items-center justify-center shrink-0 font-headline font-bold text-portal-text text-sm shadow-xs">
                {displayName.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-portal-surface" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-headline font-bold text-xs text-portal-text truncate">
                    {displayName.replace(/\s*\(.*?\)\s*/g, '')}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary border border-portal-primary/20 shrink-0">
                    {roleBadgeLabel}
                  </span>
                </div>
                <span className="text-[11px] text-portal-text-muted font-medium truncate block">
                  {roleTitle}
                </span>
                <span className="text-[10px] text-portal-text-muted font-mono truncate block mt-0.5">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Structured Action Links */}
          <div className="py-2 space-y-0.5 border-b border-portal-border/60">
            <Link
              href="/settings/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs text-portal-text hover:bg-portal-surface-hover rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="size-4 text-portal-text-muted group-hover:text-portal-primary transition-colors" weight="bold" />
                <span className="font-medium">Profile & Account</span>
              </div>
              <span className="text-[10px] text-portal-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                Settings →
              </span>
            </Link>

            <Link
              href="/settings/profile?tab=security"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs text-portal-text hover:bg-portal-surface-hover rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <LockKey className="size-4 text-portal-text-muted group-hover:text-portal-primary transition-colors" weight="bold" />
                <span className="font-medium">Security & Two-Factor (2FA)</span>
              </div>
            </Link>

            <Link
              href="/legal/privacy"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs text-portal-text hover:bg-portal-surface-hover rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-portal-text-muted group-hover:text-portal-primary transition-colors" weight="bold" />
                <span className="font-medium">Regulatory Disclosures</span>
              </div>
            </Link>
          </div>

          {/* 3. Refined Workspace Simulation Switcher (Dev Mode) */}
          <div className="pt-2 pb-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-portal-text-muted uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Swap className="size-3" weight="bold" />
                <span>Simulate Workspace</span>
              </span>
              <span className="text-[9px] opacity-60">TEST HARNESS</span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-portal-surface-hover/60 border border-portal-border/60 rounded-xl mt-1">
              <button
                type="button"
                onClick={async () => {
                  await devSwitchRole('SELLER');
                  setIsOpen(false);
                }}
                className={`text-[11px] py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  role === 'SELLER'
                    ? 'bg-portal-surface text-portal-primary shadow-2xs font-bold'
                    : 'text-portal-text-muted hover:text-portal-text'
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
                className={`text-[11px] py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  isDealer
                    ? 'bg-portal-surface text-portal-primary shadow-2xs font-bold'
                    : 'text-portal-text-muted hover:text-portal-text'
                }`}
              >
                Dealer
              </button>
              <button
                type="button"
                onClick={async () => {
                  await devSwitchRole('ADMIN');
                  setIsOpen(false);
                }}
                className={`text-[11px] py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  role === 'ADMIN'
                    ? 'bg-portal-surface text-portal-primary shadow-2xs font-bold'
                    : 'text-portal-text-muted hover:text-portal-text'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* 4. Footer & Logout */}
          <div className="pt-2 mt-1 border-t border-portal-border/60">
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer font-semibold"
            >
              <SignOut className="size-4" weight="bold" />
              <span>Sign Out of Platform</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Trigger Pill: Completely Unclipped and Centered */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
          isCollapsed
            ? 'size-10 mx-auto justify-center hover:bg-portal-surface-hover'
            : 'p-2 justify-between hover:bg-portal-surface-hover border border-portal-border shadow-2xs'
        }`}
        aria-label="User account menu"
      >
        {isCollapsed ? (
          /* Collapsed Mode: Clean centered unclipped circular avatar with status dot */
          <div className="relative size-9 rounded-full bg-gradient-to-br from-[#8C383E]/20 to-[#E59344]/30 border border-portal-border flex items-center justify-center shrink-0 font-headline font-bold text-xs text-portal-text shadow-2xs">
            {displayName.charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121212]" />
          </div>
        ) : (
          /* Expanded Mode: Full name, role, and caret */
          <>
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="relative size-9 rounded-xl bg-gradient-to-br from-[#8C383E]/20 to-[#E59344]/30 border border-portal-border flex items-center justify-center shrink-0 font-headline font-bold text-xs text-portal-text shadow-2xs">
                {displayName.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-portal-surface" />
              </div>

              <div className="flex flex-col text-left overflow-hidden min-w-0">
                <span className="text-xs font-bold text-portal-text tracking-tight truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-portal-text-muted font-mono truncate">
                  {roleTitle}
                </span>
              </div>
            </div>

            <CaretUpDown className="size-4 text-portal-text-muted shrink-0 ml-1" weight="bold" />
          </>
        )}
      </button>
    </div>
  );
}
