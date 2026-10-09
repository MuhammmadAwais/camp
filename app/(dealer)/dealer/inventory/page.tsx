'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DealerInventoryPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* 1. Terminal Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#0E1420] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Trading Facility</p>
          <p className="font-headline font-bold text-lg text-white mt-1 truncate">
            {user?.dealershipName || 'Apex Motor Group'}
          </p>
          <span className="text-[11px] font-mono text-emerald-400">OMVIC Licensed</span>
        </div>

        <div className="bg-[#0E1420] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Monthly Bids Quota</p>
          <p className="font-mono font-bold text-xl text-white mt-1">42 / 75</p>
          <span className="text-[11px] font-body text-neutral-400">Pro Tier Subscription</span>
        </div>

        <div className="bg-[#0E1420] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Active Bids Placed</p>
          <p className="font-mono font-bold text-xl text-emerald-400 mt-1">6</p>
          <span className="text-[11px] font-body text-neutral-400">3 closing within 4h</span>
        </div>

        <div className="bg-[#0E1420] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Regional Filter</p>
          <p className="font-mono font-bold text-xl text-white mt-1">50 km</p>
          <span className="text-[11px] font-body text-neutral-400">Greater Toronto Area</span>
        </div>
      </div>

      {/* 2. Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-white">Live Regional Auctions</h1>
          <p className="font-body text-xs text-neutral-400 mt-0.5">
            Verified private-seller vehicles within your registered service radius. Bids are strictly sealed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors">
            Filter: All Makes
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors">
            Sort: Ending Soonest
          </button>
        </div>
      </div>

      {/* 3. Feed Placeholder / Empty state */}
      <div className="bg-[#0E1420] border border-white/10 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-2xl mb-3 text-neutral-400">
          📡
        </div>
        <h3 className="font-headline font-bold text-lg text-white">Connecting to Regional Bidding Engine</h3>
        <p className="font-body text-xs text-neutral-400 max-w-md mx-auto mt-1">
          Dealer Terminal feed initialized. Live vehicles with verified condition reports and damage schematics will render here.
        </p>
      </div>
    </div>
  );
}
