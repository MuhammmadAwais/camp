'use client';

import React from 'react';

export default function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h1 className="font-headline font-bold text-2xl text-slate-900">Listing Moderation Queue</h1>
        <p className="font-body text-xs text-slate-500 mt-1">
          Review incoming private seller vehicle listings. Verify declared damage, VIN checks, and S3 photos before launching the 24-hour auction.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
        <p className="text-sm font-medium text-slate-600">Queue is currently clear. No pending listings awaiting review.</p>
      </div>
    </div>
  );
}
