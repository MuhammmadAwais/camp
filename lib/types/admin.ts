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
