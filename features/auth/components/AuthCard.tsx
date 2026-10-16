'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Mail, Lock, User, Building, FileText, ArrowRight, ArrowLeft, Phone, MapPin } from 'lucide-react';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthCard({ initialMode = 'signin' }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<'SELLER' | 'DEALER'>('SELLER');
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
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

  const handleNextStep = () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSignupStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If on signup step 1, advance to step 2 instead of submitting
    if (mode === 'signup' && signupStep === 1) {
      handleNextStep();
      return;
    }

    try {
      if (mode === 'signin') {
        await login({ email, password, rememberMe });
      } else if (role === 'SELLER') {
        if (!phone.trim() || !postalCode.trim()) {
          setError('Please provide your phone number and postal code');
          return;
        }
        await registerSeller({
          name,
          email,
          password,
          phone,
          postalCode,
          province: 'ON',
        });
      } else {
        if (!dealershipName.trim() || !licenseNumber.trim() || !phone.trim() || !postalCode.trim()) {
          setError('Please fill in all dealership and contact details');
          return;
        }
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
    <div className="w-full max-w-[440px] mx-auto rounded-3xl p-7 sm:p-9 relative text-white border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl bg-[#131215]/65 transition-all duration-300">
      {/* 1. Header: Mode Switcher */}
      <div className="flex items-center justify-between mb-4">
        {mode === 'signup' && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-body">
            <span className={`w-2 h-2 rounded-full ${signupStep === 1 ? 'bg-[#E59344]' : 'bg-neutral-600'}`} />
            <span className={`w-2 h-2 rounded-full ${signupStep === 2 ? 'bg-[#E59344]' : 'bg-neutral-600'}`} />
            <span className="ml-1 text-[11px] text-neutral-400">Step {signupStep} of 2</span>
          </div>
        )}
        {mode === 'signin' && <div />}

        <div className="flex items-center p-1 bg-white/[0.06] rounded-full border border-white/10 font-body text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setSignupStep(1);
              setError(null);
            }}
            className={`px-3.5 py-1 rounded-full font-body font-semibold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white/20 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupStep(1);
              setError(null);
            }}
            className={`px-3.5 py-1 rounded-full font-body font-semibold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white/20 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* 2. Main Title */}
      <div className="text-left mb-5">
        <h1 className="font-headline font-bold text-3xl sm:text-4xl text-white tracking-tight">
          {mode === 'signin'
            ? 'Login'
            : signupStep === 1
            ? 'Create Account'
            : role === 'DEALER'
            ? 'Dealer Verification'
            : 'Contact Details'}
        </h1>
        {mode === 'signup' && (
          <p className="text-xs text-neutral-400 font-body mt-1">
            {signupStep === 1
              ? 'Enter your basic account details to get started'
              : 'Add your location and verification info'}
          </p>
        )}
      </div>

      {/* 3. Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-body text-xs font-medium text-center">
          {error}
        </div>
      )}

      {/* 4. Role Selector (Only on Signup Step 1) */}
      {mode === 'signup' && signupStep === 1 && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.05] border border-white/15 rounded-xl mb-4 backdrop-blur-md font-body">
          <button
            type="button"
            onClick={() => setRole('SELLER')}
            className={`py-2 px-3 text-xs font-body font-semibold rounded-lg transition-all cursor-pointer ${
              role === 'SELLER'
                ? 'bg-[#E59344]/25 text-[#E59344] border border-[#E59344]/50 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Private Seller
          </button>
          <button
            type="button"
            onClick={() => setRole('DEALER')}
            className={`py-2 px-3 text-xs font-body font-semibold rounded-lg transition-all cursor-pointer ${
              role === 'DEALER'
                ? 'bg-[#E59344]/25 text-[#E59344] border border-[#E59344]/50 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Dealership
          </button>
        </div>
      )}

      {/* 5. Main Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 font-body">
        {/* ===================== SIGNUP STEP 1: Basic Credentials ===================== */}
        {mode === 'signup' && signupStep === 1 && (
          <>
            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'SELLER' ? 'Your legal full name' : 'Contact person name'}
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@gmail.com"
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-11 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Step 1 Next Button (Clean, No Glow) */}
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full mt-2 bg-[#8C383E] hover:bg-[#752B30] text-white font-body font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] text-sm cursor-pointer shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* ===================== SIGNUP STEP 2: Compliance & Location ===================== */}
        {mode === 'signup' && signupStep === 2 && (
          <>
            {role === 'DEALER' && (
              <>
                <div>
                  <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Dealership Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={dealershipName}
                      onChange={(e) => setDealershipName(e.target.value)}
                      placeholder="Dealership Operating Name"
                      className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">License Number</label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="OMVIC / AMVIC / VSA License #"
                      className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(416) 555-0192"
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Postal Code</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                  placeholder="e.g. M5V 2T6"
                  maxLength={7}
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
              </div>
            </div>

            {/* Step 2 Actions (Clean, No Glow) */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#8C383E] hover:bg-[#752B30] text-white font-body font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 text-sm cursor-pointer shadow-sm"
              >
                {isLoading
                  ? 'Processing...'
                  : `Create ${role === 'SELLER' ? 'Seller' : 'Dealer'} Account`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSignupStep(1);
                }}
                className="w-full py-2 text-xs font-body text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1</span>
              </button>
            </div>
          </>
        )}

        {/* ===================== SIGNIN VIEW ===================== */}
        {mode === 'signin' && (
          <>
            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@gmail.com"
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-body font-medium text-neutral-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.06] border border-white/15 text-white placeholder:text-neutral-400 rounded-xl pl-10 pr-11 py-2.5 font-body text-sm outline-none focus:border-[#E59344] focus:ring-1 focus:ring-[#E59344] transition-all backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between font-body text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white transition-colors font-body">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[#E59344] focus:ring-[#E59344]/30 accent-[#E59344]"
                />
                Remember me
              </label>
              <a
                href="#forgot"
                className="text-neutral-300 hover:text-white transition-colors font-body"
              >
                Forgot Password?
              </a>
            </div>

            {/* Primary Action Button (Clean, No Glow) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#8C383E] hover:bg-[#752B30] text-white font-body font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 text-sm cursor-pointer shadow-sm"
            >
              {isLoading ? 'Processing...' : 'Sign In'}
            </button>
          </>
        )}

        {/* Divider & Social Login (Visible on signin OR signup step 1) */}
        {(mode === 'signin' || (mode === 'signup' && signupStep === 1)) && (
          <>
            <div className="relative py-2 flex items-center justify-center font-body">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15" />
              </div>
              <span className="relative bg-[#17161b] px-3 font-body text-[11px] uppercase tracking-wider text-neutral-400 rounded-full border border-white/10">
                or continue with
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                login({
                  email: 'seller@autonexa.ca',
                  password: 'password',
                  rememberMe: true,
                })
              }
              className="w-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 font-body text-xs font-medium text-white shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>
          </>
        )}
      </form>
    </div>
  );
}
