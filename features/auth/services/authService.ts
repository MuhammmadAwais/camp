import type {
  User,
  UserRole,
  LoginCredentials,
  RegisterSellerPayload,
  RegisterDealerPayload,
} from '../types';

const STORAGE_KEY = 'autonexa_active_user';

export const SEED_USERS: Record<UserRole, User> = {
  SELLER: {
    id: 'usr_seller_001',
    email: 'seller@autonexa.ca',
    name: 'Jordan Tremblay',
    phone: '+1 (416) 555-0142',
    postalCode: 'M5V 2T6',
    province: 'ON',
    role: 'SELLER',
    kycStatus: 'VERIFIED',
    createdAt: '2026-08-15T10:00:00Z',
  },
  DEALER_ADMIN: {
    id: 'usr_dealer_admin_001',
    email: 'dealer@autonexa.ca',
    name: 'Christopher Evans',
    phone: '+1 (905) 555-8291',
    postalCode: 'L6M 4W9',
    province: 'ON',
    role: 'DEALER_ADMIN',
    kycStatus: 'VERIFIED',
    dealershipId: 'dlr_pfaff_001',
    dealershipName: 'Pfaff Porsche Markham',
    dealerLicenseNumber: 'OMVIC #481920',
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
    dealershipId: 'dlr_pfaff_001',
    dealershipName: 'Pfaff Porsche Markham',
    createdAt: '2026-08-20T09:15:00Z',
  },
  ADMIN: {
    id: 'usr_admin_001',
    email: 'admin@autonexa.ca',
    name: 'Sarah Tremblay (Lead Compliance)',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    createdAt: '2026-01-01T00:00:00Z',
  },
};

/**
 * Feature-Based Auth Service
 * Isolated boundary for authentication API integration.
 */
export const authService = {
  /**
   * Retrieves currently authenticated user from client storage
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Simulates login or forwards to external backend when provided
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Artificial latency for realistic micro-animation feedback
    await new Promise((r) => setTimeout(r, 400));

    const email = credentials.email.toLowerCase().trim();
    let user: User;

    if (email.includes('dealer')) {
      user = SEED_USERS.DEALER_ADMIN;
    } else if (email.includes('agent')) {
      user = SEED_USERS.DEALER_AGENT;
    } else if (email.includes('admin')) {
      user = SEED_USERS.ADMIN;
    } else {
      user = {
        ...SEED_USERS.SELLER,
        email,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }

    return user;
  },

  /**
   * Simulates registration for private sellers
   */
  async registerSeller(payload: RegisterSellerPayload): Promise<User> {
    await new Promise((r) => setTimeout(r, 500));

    const newUser: User = {
      id: `usr_seller_${Date.now()}`,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      postalCode: payload.postalCode,
      province: payload.province,
      role: 'SELLER',
      kycStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    }

    return newUser;
  },

  /**
   * Simulates registration for dealerships
   */
  async registerDealer(payload: RegisterDealerPayload): Promise<User> {
    await new Promise((r) => setTimeout(r, 500));

    const newUser: User = {
      id: `usr_dealer_${Date.now()}`,
      email: payload.email,
      name: payload.contactName,
      phone: payload.phone,
      postalCode: payload.postalCode,
      province: payload.province,
      role: 'DEALER_ADMIN',
      kycStatus: 'VERIFIED',
      dealershipId: `dlr_${Date.now()}`,
      dealershipName: payload.operatingName || payload.legalBusinessName,
      dealerLicenseNumber: `${payload.licensingBody} #${payload.licenseNumber}`,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    }

    return newUser;
  },

  /**
   * Clears session
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  /**
   * Dev helper for 1-click role simulation
   */
  switchRole(role: UserRole | 'LOGOUT'): User | null {
    if (typeof window === 'undefined') return null;

    if (role === 'LOGOUT') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const user = SEED_USERS[role];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },
};
