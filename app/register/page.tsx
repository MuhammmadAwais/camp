'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthCard } from '@/features/auth/components/AuthCard';

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Dark Automotive Backdrop */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/illustrations/why-us.webp"
          alt="AutoNexa Luxury Automotive Exchange"
          fill
          priority
          quality={90}
          className="object-cover object-center select-none"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/85 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* 2. Top Header */}
      <header className="relative z-10 w-full px-6 py-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="AutoNexa"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="font-headline font-bold text-lg text-white tracking-tight">
            Auto<span className="text-emerald-400">Nexa</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-body font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <span>&larr;</span> Back to Home
        </Link>
      </header>

      {/* 3. Centered Glassmorphic AuthCard Feature in Sign Up Mode */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <AuthCard initialMode="signup" />
      </main>

      {/* 4. Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-neutral-500 font-body">
        Protected by PIPEDA & Quebec Law 25 &bull; OMVIC, AMVIC & VSA Licensed Exchange
      </footer>
    </div>
  );
}
