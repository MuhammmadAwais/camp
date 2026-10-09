'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/authService';
import type {
  User,
  UserRole,
  LoginCredentials,
  RegisterSellerPayload,
  RegisterDealerPayload,
} from '@/features/auth/types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  registerSeller: (payload: RegisterSellerPayload) => Promise<User>;
  registerDealer: (payload: RegisterDealerPayload) => Promise<User>;
  logout: () => Promise<void>;
  devSwitchRole: (role: UserRole | 'LOGOUT') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = useCallback(() => {
    try {
      const active = authService.getCurrentUser();
      setUser(active);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedIn = await authService.login(credentials);
      setUser(loggedIn);

      // Smart routing by role
      if (loggedIn.role === 'SELLER') router.push('/seller/dashboard');
      else if (loggedIn.role === 'ADMIN') router.push('/admin/moderation');
      else router.push('/dealer/inventory');

      return loggedIn;
    } finally {
      setIsLoading(false);
    }
  };

  const registerSeller = async (payload: RegisterSellerPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await authService.registerSeller(payload);
      setUser(newUser);
      router.push('/seller/dashboard');
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerDealer = async (payload: RegisterDealerPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await authService.registerDealer(payload);
      setUser(newUser);
      router.push('/dealer/inventory');
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const devSwitchRole = async (role: UserRole | 'LOGOUT') => {
    setIsLoading(true);
    try {
      const switched = authService.switchRole(role);
      setUser(switched);
      if (!switched) {
        router.push('/login');
      } else if (switched.role === 'SELLER') {
        router.push('/seller/dashboard');
      } else if (switched.role === 'ADMIN') {
        router.push('/admin/moderation');
      } else {
        router.push('/dealer/inventory');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerSeller,
        registerDealer,
        logout,
        devSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
