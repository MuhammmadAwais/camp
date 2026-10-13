'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { Auth3DBackground } from '@/features/auth/components/Auth3DBackground';

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#000000] overflow-hidden flex items-center justify-center p-4 sm:p-6 selection:bg-[#008C87] selection:text-white">
      {/* 1. Brand Logo Mark + "AutoNexa" Wordmark (Balanced Design Proportions) */}
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-7 sm:left-8 md:top-8 md:left-10 z-20 flex items-center gap-2.5 sm:gap-3 group transition-opacity hover:opacity-90 cursor-pointer select-none"
        title="AutoNexa Home"
      >
        <div className="relative w-[50px] sm:w-[58px] h-7 sm:h-8 shrink-0 flex items-center">
          <Image
            src="/logo-mark-tight.webp"
            alt="AutoNexa Logo"
            fill
            priority
            className="object-contain select-none"
          />
        </div>
        <span className="font-headline font-bold text-xl sm:text-2xl text-white tracking-tight leading-none">
          Auto<span className="text-[#E59344]">Nexa</span>
        </span>
      </Link>

      {/* 2. 3D Animated Background Elements in Web App Theme */}
      <Auth3DBackground />

      {/* 3. Centered Frosted Glass Auth Card */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <AuthCard initialMode="signup" />
      </div>
    </main>
  );
}
