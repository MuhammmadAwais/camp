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
        className={`group relative flex items-center justify-center size-9 rounded-full transition-all duration-200 cursor-pointer border ${
          currentTheme === 'dark'
            ? 'bg-[#121114]/90 border-white/10 text-neutral-300 hover:text-white hover:border-[#E59344]'
            : 'bg-white/90 border-[#EADDCB] text-gray-700 hover:text-[#201B11] hover:border-[#8C383E]'
        } shadow-xs ${className}`}
      >
        {currentTheme === 'dark' ? (
          <Sun className="size-4 transition-transform duration-300 group-hover:rotate-45 text-[#E59344]" />
        ) : (
          <Moon className="size-4 transition-transform duration-300 group-hover:-rotate-12 text-[#8C383E]" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme mode selector"
      className={`relative inline-flex items-center p-1 rounded-full border transition-all duration-300 backdrop-blur-xl ${
        currentTheme === 'dark'
          ? 'bg-[#121114]/80 border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          : 'bg-[#FFF8F2]/90 border-[#EADDCB] shadow-[0_2px_10px_rgba(56,20,24,0.06)]'
      } ${className}`}
    >
      {/* Light Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={currentTheme === 'light'}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
          currentTheme === 'light'
            ? 'bg-white text-[#201B11] shadow-sm border border-[#EADDCB] font-semibold'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
      >
        <Sun
          className={`size-3.5 transition-colors ${
            currentTheme === 'light' ? 'text-[#8C383E]' : 'text-current'
          }`}
        />
        <span>Light</span>
      </button>

      {/* Dark Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={currentTheme === 'dark'}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
          currentTheme === 'dark'
            ? 'bg-[#1C1917] text-white shadow-sm border border-white/10 font-semibold'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
      >
        <Moon
          className={`size-3.5 transition-colors ${
            currentTheme === 'dark' ? 'text-[#E59344]' : 'text-current'
          }`}
        />
        <span>Dark</span>
      </button>
    </div>
  );
}
