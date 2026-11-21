'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  CaretUpDown,
  User as UserIcon,
  SignOut,
  FileText,
  LockKey,
  SignIn,
} from '@phosphor-icons/react';
import { useCurrentUser, useLogout } from '@/hooks/useSession';

interface UserProfileCardProps {
  isCollapsed: boolean;
}

export function UserProfileCard({ isCollapsed }: UserProfileCardProps) {
  const t = useTranslations('userMenu');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: sessionUser, isPending } = useCurrentUser();
  const logoutMutation = useLogout();

  const role = sessionUser?.role ?? null;
  const isDealer = role === 'DEALER_ADMIN' || role === 'DEALER_AGENT';
  const isAdmin = role === 'ADMIN';

  const displayName = sessionUser
    ? `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || sessionUser.email
    : '';

  const userEmail = sessionUser?.email ?? '';

  const roleTitle = isAdmin
    ? t('adminRole')
    : isDealer
    ? t('dealerRole')
    : t('sellerRole');

  const roleBadgeLabel = isAdmin ? 'ADMIN' : isDealer ? 'DEALER' : 'SELLER';

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

  if (isPending) {
    return (
      <div className="w-full h-11 rounded-xl bg-portal-surface-hover/50 animate-pulse border border-portal-border" />
    );
  }

  if (!sessionUser) {
    return (
      <Link
        href="/login"
        className={`w-full flex items-center rounded-xl transition-all cursor-pointer border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-bold shadow-2xs ${
          isCollapsed
            ? 'size-10 mx-auto justify-center'
            : 'px-3 py-2.5 justify-center gap-2'
        }`}
      >
        <SignIn className="size-4 text-portal-primary shrink-0" weight="bold" />
        {!isCollapsed && <span>{tCommon('signIn')}</span>}
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full font-body select-none">
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
              <div className="relative size-10 rounded-xl bg-portal-primary/15 border border-portal-border flex items-center justify-center shrink-0 font-headline font-bold text-portal-text text-sm shadow-xs">
                {displayName.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-portal-surface" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-headline font-bold text-xs text-portal-text truncate">
                    {displayName}
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
          <div className="py-2 space-y-0.5">
            <Link
              href="/settings/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs text-portal-text hover:bg-portal-surface-hover rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="size-4 text-portal-text-muted group-hover:text-portal-primary transition-colors" weight="bold" />
                <span className="font-medium">{t('profileAccount')}</span>
              </div>
              <span className="text-[10px] text-portal-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </Link>

            <Link
              href="/settings/security"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs text-portal-text hover:bg-portal-surface-hover rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <LockKey className="size-4 text-portal-text-muted group-hover:text-portal-primary transition-colors" weight="bold" />
                <span className="font-medium">{t('securityMfa')}</span>
              </div>
            </Link>

            <Link
              href="/legal/privacy"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 text-xs text-portal-text hover:bg-portal-surface-hover rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-portal-text-muted group-hover:text-portal-primary transition-colors" weight="bold" />
                <span className="font-medium">{t('regulatoryDisclosures')}</span>
              </div>
            </Link>
          </div>

          {/* 3. Footer & Logout */}
          <div className="pt-2 mt-1 border-t border-portal-border/60">
            <button
              type="button"
              disabled={logoutMutation.isPending}
              onClick={() => {
                setIsOpen(false);
                logoutMutation.mutate();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer font-semibold disabled:opacity-50"
            >
              <SignOut className="size-4" weight="bold" />
              <span>{t('signOutPlatform')}</span>
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
            ? 'size-10 mx-auto justify-center hover:bg-portal-surface-hover'
            : 'p-2 justify-between hover:bg-portal-surface-hover border border-portal-border shadow-2xs'
        }`}
        aria-label="User account menu"
      >
        {isCollapsed ? (
          <div className="relative size-9 rounded-full bg-portal-primary/15 border border-portal-border flex items-center justify-center shrink-0 font-headline font-bold text-xs text-portal-text shadow-2xs">
            {displayName.charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-portal-surface" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="relative size-9 rounded-xl bg-portal-primary/15 border border-portal-border flex items-center justify-center shrink-0 font-headline font-bold text-xs text-portal-text shadow-2xs">
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
