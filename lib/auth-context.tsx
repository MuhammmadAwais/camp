'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useCurrentUser, useLogout } from '@/hooks/useSession';
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
  const { data: sessionUser, isPending } = useCurrentUser();
  const logoutMutation = useLogout();
  const router = useRouter();

  const user = useMemo<User | null>(() => {
    if (!sessionUser) return null;
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || sessionUser.email,
      phone: sessionUser.phoneMasked,
      postalCode: sessionUser.postalCode,
      province: sessionUser.province,
      role: sessionUser.role,
      kycStatus:
        sessionUser.kycStatus === 'NOT_STARTED'
          ? 'PENDING'
          : sessionUser.kycStatus,
      createdAt: '',
    };
  }, [sessionUser]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const loggedIn = await authService.login(credentials);
    if (loggedIn.role === 'SELLER') router.push('/seller/dashboard');
    else if (loggedIn.role === 'ADMIN') router.push('/admin/moderation');
    else router.push('/dealer/inventory');
    return loggedIn;
  };

  const registerSeller = async (payload: RegisterSellerPayload): Promise<User> => {
    const newUser = await authService.registerSeller(payload);
    router.push('/seller/dashboard');
    return newUser;
  };

  const registerDealer = async (payload: RegisterDealerPayload): Promise<User> => {
    const newUser = await authService.registerDealer(payload);
    router.push('/dealer/inventory');
    return newUser;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const devSwitchRole = async () => {
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading: isPending,
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
