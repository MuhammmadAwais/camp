'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { Auth3DBackground } from '@/features/auth/components/Auth3DBackground';

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#000000] overflow-hidden flex items-center justify-center p-4 sm:p-6 selection:bg-[#008C87] selection:text-white">
      {/* 1. Brand Logo Mark + "AutoNexa" Wordmark (Enlarged) */}
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-10 md:top-10 md:left-12 z-20 flex items-center gap-3.5 sm:gap-4 group transition-transform hover:scale-105 cursor-pointer select-none"
        title="AutoNexa Home"
      >
        <div className="relative w-14 sm:w-16 md:w-20 h-9 sm:h-10 md:h-12 shrink-0">
          <Image
            src="/logo-mark.webp"
            alt="AutoNexa Logo"
            fill
            priority
            className="object-contain select-none drop-shadow-[0_2px_14px_rgba(229,147,68,0.4)]"
          />
        </div>
        <span className="font-headline font-bold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-none">
          Auto<span className="text-[#E59344]">Nexa</span>
        </span>
      </Link>

      {/* 2. 3D Animated Background Elements in Web App Theme */}
      <Auth3DBackground />

      {/* 3. Centered Frosted Glass Auth Card */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <AuthCard initialMode="signin" />
      </div>
    </main>
  );
}
