'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password, rememberMe });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-card rounded-2xl p-6 sm:p-8 relative">
      {/* Segmented Pill Tabs */}
      <div className="flex items-center justify-center p-1 bg-white/[0.06] rounded-full max-w-[200px] mx-auto mb-6 border border-white/10">
        <Link
          href="/register"
          className="flex-1 text-center py-1.5 px-3 text-xs font-medium text-neutral-400 hover:text-white transition-colors rounded-full"
        >
          Sign Up
        </Link>
        <span className="flex-1 text-center py-1.5 px-3 text-xs font-semibold text-white bg-white/15 rounded-full shadow-xs">
          Sign In
        </span>
      </div>

      <div className="text-center mb-6">
        <h1 className="font-headline font-bold text-2xl text-white tracking-tight">Welcome Back</h1>
        <p className="font-body text-xs text-neutral-400 mt-1">
          Access your AutoNexa wholesale trading portal.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@dealership.ca or name@email.com"
            className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder:text-neutral-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder:text-neutral-500"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30"
            />
            Remember me
          </label>
          <a href="#forgot" className="text-neutral-400 hover:text-emerald-400 transition-colors">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-white text-slate-950 hover:bg-neutral-100 font-body font-semibold py-3 px-4 rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 text-sm"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
