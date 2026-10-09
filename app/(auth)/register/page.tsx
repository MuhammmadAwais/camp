'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { registerSeller, registerDealer, isLoading } = useAuth();
  const [role, setRole] = React.useState<'SELLER' | 'DEALER'>('SELLER');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [dealershipName, setDealershipName] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (role === 'SELLER') {
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
          address: '100 King St W',
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
        setError('Registration failed');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-card rounded-2xl p-6 sm:p-8 relative">
      {/* Segmented Pill Tabs */}
      <div className="flex items-center justify-center p-1 bg-white/[0.06] rounded-full max-w-[200px] mx-auto mb-6 border border-white/10">
        <span className="flex-1 text-center py-1.5 px-3 text-xs font-semibold text-white bg-white/15 rounded-full shadow-xs">
          Sign Up
        </span>
        <Link
          href="/login"
          className="flex-1 text-center py-1.5 px-3 text-xs font-medium text-neutral-400 hover:text-white transition-colors rounded-full"
        >
          Sign In
        </Link>
      </div>

      <div className="text-center mb-6">
        <h1 className="font-headline font-bold text-2xl text-white tracking-tight">Create Account</h1>
        <p className="font-body text-xs text-neutral-400 mt-1">
          Join Canada&apos;s 24-hour wholesale automotive exchange.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-6">
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

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            {role === 'SELLER' ? 'Full Legal Name' : 'Primary Contact Name'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500"
          />
        </div>

        {role === 'DEALER' && (
          <>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Dealership Legal Name</label>
              <input
                type="text"
                required
                value={dealershipName}
                onChange={(e) => setDealershipName(e.target.value)}
                placeholder="Apex Motor Group Inc."
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">OMVIC / AMVIC License #</label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="4928192"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Mobile Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="416-555-0199"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Postal Code</label>
            <input
              type="text"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              placeholder="M5V 2T6"
              maxLength={7}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-neutral-500 uppercase"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 bg-white text-slate-950 hover:bg-neutral-100 font-body font-semibold py-3 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 text-sm"
        >
          {isLoading ? 'Creating Account...' : `Register as ${role === 'SELLER' ? 'Seller' : 'Dealership'}`}
        </button>
      </form>
    </div>
  );
}
