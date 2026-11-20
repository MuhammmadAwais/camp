import type { KycStatus } from "@/lib/types/auth";
import type { AuctionStatus } from "@/lib/types/seller";

export type ModerationStatus =
  | "PENDING"
  | "APPROVED"
  | "EDITS_REQUESTED"
  | "REJECTED";

export type ModerationDecisionAction = "APPROVE" | "REQUEST_EDITS" | "REJECT";

export type ModerationPhoto = {
  url: string;
  label: string;
};

export type ModerationItem = {
  id: string;
  submittedAt: string;
  submittedAtIso: string;
  listingStatus: AuctionStatus;
  auctionEndsAt?: string | null;
  moderationNotes?: string | null;
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    province: string;
    kycStatus: KycStatus;
  };
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    mileageKm: number;
    engineSpec?: string;
    transmission: string;
    drivetrain: string;
    reservePriceCents: number; // Integer CAD cents invariant
    damageGrade: string;
    damageHotspotCount: number;
    photosCount: number;
    thumbnailUrl: string;
    photos: ModerationPhoto[];
    lienDisclosed: boolean;
    lienHolder?: string;
    keysCount: number;
    sellerNotes: string;
    carfaxSummary?: {
      owners: number;
      accidents: number;
      serviceRecords: number;
    };
  };
  checks: {
    vinDecoded: boolean;
    odometerLegible: boolean;
    damageMapped: boolean;
    ownershipVerified: boolean;
  };
  status: ModerationStatus;
};

export type ModerationQueueCounts = {
  ALL: number;
  PENDING: number;
  EDITS_REQUESTED: number;
  APPROVED: number;
  REJECTED: number;
};

export type ModerationQueueResponse = {
  items: ModerationItem[];
  counts: ModerationQueueCounts;
};

export type AdminAuctionStatus =
  | "ACTIVE"
  | "UNSEALED"
  | "ACCEPTED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type AdminAuctionLot = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  sellerName: string;
  city: string;
  province: string;
  status: AdminAuctionStatus;
  totalBidsCount: number;
  reservePriceCents: number; // Integer CAD cents invariant
  highestBidEstimateCents?: number;
  endsAt: string;
  closedAt?: string | null;
  thumbnailUrl: string;
};

export type AdminAuctionsSummary = {
  activeCount: number;
  urgentCount: number;
  unsealedCount: number;
  acceptedCount: number;
  totalCount: number;
};

export type AdminAuctionsResponse = {
  items: AdminAuctionLot[];
  summary: AdminAuctionsSummary;
  serverTime: string;
};

export type AdminAuctionOverrideAction = "EXTEND" | "FORCE_CLOSE" | "HALT";

export type AdminAuctionOverridePayload = {
  action: AdminAuctionOverrideAction;
  reason: string;
  extensionHours?: number;
};

export type AdminAuctionOverrideResult = {
  lot: AdminAuctionLot;
  action: AdminAuctionOverrideAction;
  auditAction: string;
  message: string;
  serverTime: string;
};

export type AdminDealerStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "REVOKED";

export type AdminDealerRegulator = "OMVIC" | "AMVIC" | "VSA" | "OPC";

export type AdminDealerApplication = {
  id: string;
  dealershipName: string;
  legalEntityName: string;
  businessNumber?: string | null;
  regulator: AdminDealerRegulator;
  licenseNumber: string;
  licenseExpiry?: string | null;
  licenseDocPath?: string | null;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactName: string;
  contactTitle?: string | null;
  contactEmail: string;
  contactPhone: string;
  serviceRadiusKm: number;
  submittedAt: string;
  verifiedAt?: string | null;
  status: AdminDealerStatus;
  notes?: string | null;
  activeBidsCount: number;
  teamMembersCount: number;
  subscriptionStatus?: string | null;
  planName?: string | null;
};

export type AdminDealerCounts = {
  ALL: number;
  PENDING: number;
  VERIFIED: number;
  REJECTED: number;
  SUSPENDED: number;
  REVOKED: number;
};

export type AdminDealersResponse = {
  items: AdminDealerApplication[];
  counts: AdminDealerCounts;
  serverTime: string;
};

export type AdminDealerDecisionAction =
  | "APPROVE"
  | "REJECT"
  | "SUSPEND"
  | "REVOKE";

export type AdminDealerDecisionPayload = {
  action: AdminDealerDecisionAction;
  notes?: string;
};

export type AdminDealerDecisionResult = {
  dealer: AdminDealerApplication;
  action: AdminDealerDecisionAction;
  voidedBidsCount: number;
  affectedListingIds: string[];
  auditAction: string;
  message: string;
  serverTime: string;
};
