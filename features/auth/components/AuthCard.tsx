'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthCard({ initialMode = 'signin' }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<'SELLER' | 'DEALER'>('SELLER');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const { login, registerSeller, registerDealer, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'signin') {
        await login({ email, password, rememberMe });
      } else if (role === 'SELLER') {
        await registerSeller({
          name,
          email,
          password,
          phone,
          postalCode,
          province: 'ON',
        });
      } else {
        await registerDealer({
          contactName: name,
          email,
          password,
          phone,
          legalBusinessName: dealershipName,
          operatingName: dealershipName,
          businessNumber: '123456789RT0001',
          licenseNumber,
          licensingBody: 'OMVIC',
          address: '100 King St West',
          city: 'Toronto',
          province: 'ON',
          postalCode,
          serviceRadiusKm: 50,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication request failed');
      }
    }
  };

  return (
    <div className="w-full max-w-[430px] mx-auto glass-card rounded-3xl p-6 sm:p-8 relative text-white border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl bg-[#090D16]/80 transition-all duration-300">
      {/* 1. Top Segmented Pill Toggle (Sign up | Sign in) */}
      <div className="flex items-center justify-center p-1 bg-white/[0.05] rounded-full max-w-[210px] mx-auto mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 ${
            mode === 'signup'
              ? 'bg-white/15 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError(null);
          }}
          className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 ${
            mode === 'signin'
              ? 'bg-white/15 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Sign in
        </button>
      </div>

      {/* 2. Header & Title */}
      <div className="text-left mb-6">
        <h1 className="font-headline font-bold text-2xl sm:text-[26px] text-white tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="font-body text-xs text-neutral-400 mt-1 leading-relaxed">
          {mode === 'signin'
            ? 'Access your wholesale terminal and active auctions.'
            : 'Join Canada’s 24-hour sealed-bid automotive exchange.'}
        </p>
      </div>

      {/* 3. Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {/* 4. In-Card Role Selector for Sign Up */}
      {mode === 'signup' && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setRole('SELLER')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              role === 'SELLER'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🚗 Private Seller
          </button>
          <button
            type="button"
            onClick={() => setRole('DEALER')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              role === 'DEALER'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🏢 Dealership
          </button>
        </div>
      )}

      {/* 5. The Main Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'signup' && (
          <div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                👤
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'SELLER' ? 'Full legal name' : 'Contact person name'}
                className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-neutral-500"
              />
            </div>
          </div>
        )}

        {mode === 'signup' && role === 'DEALER' && (
          <>
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  🏢
                </span>
                <input
                  type="text"
                  required
                  value={dealershipName}
                  onChange={(e) => setDealershipName(e.target.value)}
                  placeholder="Dealership Operating Name"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  📄
                </span>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="OMVIC / AMVIC / VSA License #"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-neutral-500 font-mono"
                />
              </div>
            </div>
          </>
        )}

        {/* Email Field with Icon */}
        <div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
              ✉
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Password Field with Icon and Eye Toggle */}
        <div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
              🔒
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full glass-input rounded-xl pl-10 pr-11 py-3 text-sm placeholder:text-neutral-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors text-sm"
            >
              {showPassword ? '👁' : '👁‍🗨'}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile Phone"
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs placeholder:text-neutral-500"
            />
            <input
              type="text"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              placeholder="Postal Code"
              maxLength={7}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs placeholder:text-neutral-500 uppercase font-mono"
            />
          </div>
        )}

        {/* Remember Me & Forgot Password (Sign in view) */}
        {mode === 'signin' && (
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
              />
              Remember me
            </label>
            <a href="#forgot" className="text-neutral-400 hover:text-white transition-colors">
              Forgot password?
            </a>
          </div>
        )}

        {/* Primary Action Button (Pure White High-Contrast) */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-white text-slate-950 hover:bg-neutral-100 font-body font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all active:scale-[0.99] disabled:opacity-50 text-sm"
        >
          {isLoading
            ? 'Processing...'
            : mode === 'signin'
            ? 'Sign in'
            : `Create ${role === 'SELLER' ? 'Seller' : 'Dealer'} Account`}
        </button>

        {/* Divider */}
        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#090D16] px-3 text-[10px] uppercase tracking-wider font-mono text-neutral-500">
            or sign in with
          </span>
        </div>

        {/* Social Login: Continue with Google */}
        <button
          type="button"
          onClick={() => login({ email: 'seller@autonexa.ca', password: 'password', rememberMe: true })}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-body font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 text-xs active:scale-[0.99]"
        >
          {/* Google G SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>
      </form>

      {/* 6. Footer Terms Notice */}
      <p className="text-[11px] text-neutral-500 text-center mt-5 leading-relaxed font-body">
        By continuing, you agree to our{' '}
        <a href="#terms" className="text-neutral-400 hover:text-white underline underline-offset-2">
          Terms &amp; Service
        </a>
      </p>
    </div>
  );
}
