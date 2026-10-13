'use client';

import React from 'react';

export function Auth3DBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Deep Atmospheric Dark Canvas with Brand Green / Emerald Lighting */}
      <div className="absolute inset-0 bg-[#000000]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_32%,rgba(0,180,130,0.22)_0%,rgba(0,110,85,0.08)_45%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_80%,rgba(0,140,110,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,120,95,0.05)_0%,transparent_80%)]" />
    </div>
  );
}
