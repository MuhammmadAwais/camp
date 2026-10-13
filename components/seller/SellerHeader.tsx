"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useSession";
import type { SessionUser } from "@/lib/types/auth";

interface Props {
  user: SessionUser;
}

export function SellerHeader({ user }: Props) {
  const logout = useLogout();
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-portal-border bg-portal-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="AutoNexa seller dashboard">
          <span className="relative w-9 h-5">
            <Image src="/logo-mark.webp" alt="" fill sizes="36px" className="object-contain" />
          </span>
          <span className="font-headline text-base font-bold tracking-tight text-portal-text">AutoNexa</span>
          <span className="hidden sm:inline rounded-full bg-portal-primary-tint px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider text-portal-primary">
            Seller
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="font-body text-sm font-semibold text-portal-text leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="font-body text-xs text-portal-text-muted leading-tight">{user.email}</p>
          </div>
          <span className="w-9 h-9 rounded-full bg-portal-surface-hover border border-portal-border flex items-center justify-center font-body text-xs font-bold text-portal-text" aria-hidden>
            {initials}
          </span>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-portal-text-muted hover:bg-portal-surface-hover hover:text-portal-text transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
