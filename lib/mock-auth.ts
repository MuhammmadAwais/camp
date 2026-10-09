import type { User, UserRole, Session } from '@/types/auth';

export const SEED_USERS: Record<UserRole, User> = {
  SELLER: {
    id: 'usr_seller_001',
    email: 'seller@autonexa.ca',
    name: 'David Tremblay',
    phone: '+1 (416) 555-0192',
    postalCode: 'M5V 2T6',
    province: 'ON',
    role: 'SELLER',
    kycStatus: 'VERIFIED',
    createdAt: '2026-08-15T10:00:00Z',
  },
  DEALER_ADMIN: {
    id: 'usr_dealer_admin_001',
    email: 'dealer@autonexa.ca',
    name: 'Sarah Jenkins',
    phone: '+1 (416) 555-0844',
    postalCode: 'M3C 1H5',
    province: 'ON',
    role: 'DEALER_ADMIN',
    kycStatus: 'VERIFIED',
    dealershipId: 'dlr_toronto_001',
    dealershipName: 'Apex Motor Group Toronto',
    dealerLicenseNumber: 'OMVIC #4928192',
    createdAt: '2026-07-01T14:30:00Z',
  },
  DEALER_AGENT: {
    id: 'usr_dealer_agent_001',
    email: 'agent@autonexa.ca',
    name: 'Marcus Vance',
    phone: '+1 (416) 555-0912',
    postalCode: 'M3C 1H5',
    province: 'ON',
    role: 'DEALER_AGENT',
    kycStatus: 'VERIFIED',
    dealershipId: 'dlr_toronto_001',
    dealershipName: 'Apex Motor Group Toronto',
    createdAt: '2026-08-20T09:15:00Z',
  },
  ADMIN: {
    id: 'usr_admin_001',
    email: 'admin@autonexa.ca',
    name: 'Operations Desk',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    createdAt: '2026-01-01T00:00:00Z',
  },
};

export function createMockSessionForRole(role: UserRole): Session {
  const user = SEED_USERS[role];
  return {
    user,
    token: `mock_jwt_token_${role.toLowerCase()}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
