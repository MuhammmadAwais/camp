import type { ProvinceCode } from "@/lib/canada";
import type { KycStatus, UserRole } from "@/lib/types/auth";
import type { AuctionStatus } from "@/lib/types/seller";

export type NotificationPreferences = {
  auctionClosing: boolean;
  outbidAlert: boolean;
  escrowDisbursement: boolean;
  complianceReview: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
};

export type AccountStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "PENDING_DELETION"
  | "DELETED";

export type ProfileSettingsResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  phoneE164: string;
  postalCode: string;
  city: string;
  province: ProvinceCode;
  languagePref: "en" | "fr";
  regulatorBoardId: string;
  role: UserRole;
  kycStatus: KycStatus;
  accountStatus: AccountStatus;
  marketingOptIn: boolean;
  mfaEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  serverTime: string;
};

export type UpdateProfileSettingsPayload = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  phoneE164?: string;
  postalCode?: string;
  city?: string;
  province?: ProvinceCode;
  languagePref?: "en" | "fr";
  regulatorBoardId?: string;
  marketingOptIn?: boolean;
  notificationPreferences?: Partial<NotificationPreferences>;
};

export type SecuritySettingsResponse = {
  email: string;
  mfaEnabled: boolean;
  aal: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneMasked: string;
  currentSession: {
    userAgentSummary: string;
    ipAddress: string;
    lastSignInAt: string | null;
  };
  serverTime: string;
};

export type UpdateSecurityPayload =
  | {
      action: "CHANGE_PASSWORD";
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  | {
      action: "REVOKE_OTHER_SESSIONS";
    };

export type UpdateSecurityResponse = {
  action: "CHANGE_PASSWORD" | "REVOKE_OTHER_SESSIONS";
  message: string;
  auditAction: string;
  serverTime: string;
};

export type PlatformConfigKey =
  | "auction_duration_hours"
  | "acceptance_window_hours"
  | "relist_cooldown_hours"
  | "min_photo_count"
  | "default_radius_km";

export type PlatformConfigItem = {
  key: PlatformConfigKey;
  value: number;
  min: number;
  max: number;
  unit: string;
  description: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type AdminPlatformConfigResponse = {
  items: PlatformConfigItem[];
  values: Record<PlatformConfigKey, number>;
  serverTime: string;
};

export type UpdatePlatformConfigPayload = {
  updates?: Partial<Record<PlatformConfigKey, number>>;
  key?: PlatformConfigKey;
  value?: number;
  reason?: string;
};

export type UpdatePlatformConfigResponse = AdminPlatformConfigResponse & {
  auditAction: string;
  message: string;
};

export type RelistVehiclePayload = {
  reservePriceCents?: number | null;
  mileageKm?: number;
  sellerNotes?: string;
};

export type RelistedListingSummary = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileageKm: number;
  status: AuctionStatus;
  reservePriceCents: number;
  coverPhotoUrl: string;
  photoCount: number;
  hotspotCount: number;
  createdAt: string;
  auctionEndsAt: string | null;
  message: string;
};

export type RelistVehicleResponse = {
  listing: RelistedListingSummary;
  parentListingId: string;
  parentStatus: "EXPIRED" | "CANCELLED";
  relistCount: number;
  message: string;
  serverTime: string;
};

export type AdminUserStatusPayload = {
  accountStatus: "ACTIVE" | "SUSPENDED";
  reason?: string;
};

export type AdminUserStatusResponse = {
  userId: string;
  email: string;
  role: UserRole;
  accountStatus: "ACTIVE" | "SUSPENDED";
  auditAction: string;
  message: string;
  serverTime: string;
};
