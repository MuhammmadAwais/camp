export type UserRole = 'SELLER' | 'DEALER_ADMIN' | 'DEALER_AGENT' | 'ADMIN';

export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type ProvincialRegulator = 'OMVIC' | 'AMVIC' | 'VSA' | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  postalCode?: string;
  province?: string;
  role: UserRole;
  kycStatus: KycStatus;
  dealershipId?: string;
  dealershipName?: string;
  dealerLicenseNumber?: string;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterSellerPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  postalCode: string;
  province: string;
}

export interface RegisterDealerPayload {
  contactName: string;
  email: string;
  password: string;
  phone: string;
  legalBusinessName: string;
  operatingName: string;
  businessNumber: string;
  licenseNumber: string;
  licensingBody: ProvincialRegulator;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: number;
}
