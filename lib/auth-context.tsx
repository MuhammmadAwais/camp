'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import type { User, UserRole, LoginCredentials, RegisterSellerPayload, RegisterDealerPayload } from '@/types/auth';

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

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await authApi.getSession();
      setUser(data.user);
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
      const { user } = await authApi.login(credentials);
      setUser(user);
      
      // Smart redirect based on role
      if (user.role === 'SELLER') router.push('/seller/dashboard');
      else if (user.role === 'ADMIN') router.push('/admin/moderation');
      else router.push('/dealer/inventory');

      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerSeller = async (payload: RegisterSellerPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const { user } = await authApi.registerSeller(payload);
      setUser(user);
      router.push('/seller/dashboard');
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerDealer = async (payload: RegisterDealerPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const { user } = await authApi.registerDealer(payload);
      setUser(user);
      router.push('/dealer/inventory');
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const devSwitchRole = async (role: UserRole | 'LOGOUT') => {
    setIsLoading(true);
    try {
      const { user } = await authApi.devSwitchRole(role);
      setUser(user);
      if (!user) {
        router.push('/login');
      } else if (user.role === 'SELLER') {
        router.push('/seller/dashboard');
      } else if (user.role === 'ADMIN') {
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
