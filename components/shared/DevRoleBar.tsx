'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/types/auth';

export function DevRoleBar() {
  const { user, role, devSwitchRole, isLoading } = useAuth();

  if (process.env.NODE_ENV === 'production') return null;

  const roles: { label: string; role: UserRole }[] = [
    { label: 'Seller', role: 'SELLER' },
    { label: 'Dealer Admin', role: 'DEALER_ADMIN' },
    { label: 'Dealer Agent', role: 'DEALER_AGENT' },
    { label: 'Admin', role: 'ADMIN' },
  ];

  return (
    <aside
      aria-label="Developer Role Bar"
      className="fixed bottom-3 right-3 z-50 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3.5 py-2 text-xs font-body text-white shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 pr-2 border-r border-white/10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">DEV AUTH:</span>
        <span className="font-semibold text-emerald-300">
          {user ? `${user.name} (${role})` : 'Anonymous'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {roles.map((item) => (
          <button
            key={item.role}
            disabled={isLoading}
            onClick={() => devSwitchRole(item.role)}
            className={`px-2 py-1 rounded-md transition-all text-[11px] font-medium ${
              role === item.role
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}

        {user && (
          <button
            disabled={isLoading}
            onClick={() => devSwitchRole('LOGOUT')}
            className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </aside>
  );
}
