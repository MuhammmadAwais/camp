'use client';

import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/lib/store/useThemeStore';

interface ThemeToggleProps {
  className?: string;
  variant?: 'segmented' | 'compact';
}

export function ThemeToggle({ className = '', variant = 'segmented' }: ThemeToggleProps) {
  const { theme, isMounted, toggleTheme, setTheme, initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Prevent hydration mismatch
  const currentTheme = isMounted ? theme : 'dark';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
        className={`group relative flex items-center justify-center size-10 rounded-xl transition-all duration-200 cursor-pointer border ${
          currentTheme === 'dark'
            ? 'bg-[#131215] border-white/15 text-white hover:border-[#008C87] hover:text-[#008C87]'
            : 'bg-white border-gray-200 text-black hover:border-[#008C87] hover:text-[#008C87]'
        } shadow-sm ${className}`}
      >
        {currentTheme === 'dark' ? (
          <Sun className="size-4.5 transition-transform duration-200 group-hover:rotate-45 text-[#008C87]" />
        ) : (
          <Moon className="size-4.5 transition-transform duration-200 group-hover:-rotate-12 text-[#008C87]" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme mode selector"
      className={`relative inline-flex items-center p-1 rounded-full transition-colors duration-200 border ${
        currentTheme === 'dark'
          ? 'bg-[#131215]/90 border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)]'
          : 'bg-gray-100/90 border-gray-200 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.06)]'
      } ${className}`}
    >
      {/* Light Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={currentTheme === 'light'}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer select-none ${
          currentTheme === 'light'
            ? 'bg-white text-black shadow-sm border border-gray-200/80 font-bold'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`}
      >
        <Sun
          className={`size-3.5 transition-colors ${
            currentTheme === 'light' ? 'text-[#008C87]' : 'text-gray-400'
          }`}
        />
        <span>Light</span>
        {currentTheme === 'light' && (
          <span
            className="size-1.5 rounded-full bg-[#008C87] animate-pulse"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Dark Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={currentTheme === 'dark'}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer select-none ${
          currentTheme === 'dark'
            ? 'bg-black text-white shadow-sm border border-white/15 font-bold'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`}
      >
        <Moon
          className={`size-3.5 transition-colors ${
            currentTheme === 'dark' ? 'text-[#008C87]' : 'text-gray-400'
          }`}
        />
        <span>Dark</span>
        {currentTheme === 'dark' && (
          <span
            className="size-1.5 rounded-full bg-[#008C87] animate-pulse"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
