'use client';

import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeStore {
  theme: ThemeMode;
  isMounted: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',
  isMounted: false,

  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setTheme: (nextTheme: ThemeMode) => {
    set({ theme: nextTheme });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('autonexa_theme', nextTheme);
        const root = document.documentElement;
        if (nextTheme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
      } catch (err) {
        console.error('Failed to persist theme:', err);
      }
    }
  },

  initializeTheme: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('autonexa_theme') as ThemeMode | null;
      // Default to dark mode for our institutional black & white dual mode
      const activeTheme: ThemeMode =
        stored === 'light' || stored === 'dark'
          ? stored
          : document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'dark';

      set({ theme: activeTheme, isMounted: true });

      const root = document.documentElement;
      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    } catch {
      set({ isMounted: true });
    }
  },
}));
