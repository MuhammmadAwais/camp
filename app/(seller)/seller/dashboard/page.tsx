'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function SellerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-portal-border rounded-2xl p-6 shadow-xs">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Private Seller Desk
          </span>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-slate-900 mt-2">
            Welcome, {user?.name || 'Seller'}
          </h1>
          <p className="font-body text-sm text-slate-500 mt-0.5">
            Monitor your 24-hour sealed-bid auctions, reviews, and verified dealership offers.
          </p>
        </div>

        <Link
          href="/seller/list-car"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99]"
        >
          <span>+</span> List Vehicle for Auction
        </Link>
      </div>

      {/* 2. KYC Verification Alert Banner (if pending) */}
      {user?.kycStatus !== 'VERIFIED' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <p className="font-semibold text-sm">Identity Verification Required</p>
              <p className="text-xs text-amber-700">
                To list a vehicle and receive binding dealer bids, please verify your government-issued ID under PIPEDA regulations.
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-colors shrink-0">
            Complete KYC
          </button>
        </div>
      )}

      {/* 3. Empty State / Active Listings Container */}
      <div className="bg-white border border-portal-border rounded-2xl p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-2xl text-slate-400 mb-4">
          🚗
        </div>
        <h3 className="font-headline font-bold text-lg text-slate-900">No Active Vehicle Auctions</h3>
        <p className="font-body text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
          Ready to get institutional wholesale competition for your car? Create your listing in under 4 minutes with instant VIN auto-decoding.
        </p>
        <Link
          href="/seller/list-car"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
        >
          Start 5-Step Listing Wizard
        </Link>
      </div>
    </div>
  );
}
