export type DamageGrade = "A" | "B" | "C" | "D";

export type WholesaleAuctionItem = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileageKm: number;
  bodyType: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  province: string;
  city: string;
  postalCode: string;
  distanceKm: number;
  damageGrade: DamageGrade;
  damageHotspotCount: number;
  thumbnailUrl: string;
  photos: string[];
  photosCount: number;
  auctionEndsAt: string;
  myCurrentBidCents?: number | null; // Integer CAD cents (only visible to the bidding dealer)
  totalBidsPlaced: number; // Sealed aggregate count
  reserveStatus: "RESERVE_MET" | "RESERVE_PENDING" | "NO_RESERVE";
  carfaxClean: boolean;
  keysCount: number;
  hasLien: boolean;
};

export type DealerQuotaSummary = {
  usedThisMonth: number;
  totalMonthlyQuota: number;
  activeBidsCount: number;
  planName?: string;
  subscriptionStatus?: string;
};

export type DealerInventoryResponse = {
  items: WholesaleAuctionItem[];
  totalCount: number;
  dealerQuota: DealerQuotaSummary;
  dealershipName: string;
  serverTime: string;
};

export type VehicleCarfaxReport = {
  ownersCount: number;
  accidentFree: boolean;
  serviceRecordsCount: number;
  lastReportedCity: string;
  registrationProvince: string;
  odometerRollbackRisk: boolean;
};

export type VehicleDamageHotspot = {
  id: string;
  panel: string;
  severity: "MINOR" | "MODERATE" | "SEVERE";
  description: string;
  viewpoint?: string;
  xPercent?: number;
  yPercent?: number;
  imageUrl?: string;
};

export type VehicleInspectionDetails = WholesaleAuctionItem & {
  status: string;
  isAuctionOpen: boolean;
  dealershipName: string;
  serverTime: string;
  engineSpec: string;
  horsepower: number | null;
  fuelType: string;
  accidentDeclaration: boolean;
  accidentCount: number;
  accidentDetails: string;
  lienDetails: string;
  carfaxReport: VehicleCarfaxReport;
  damageHotspots: VehicleDamageHotspot[];
  sellerNotes: string;
};

export type DealerTradingFloorFilters = {
  make: string;
  maxMileageKm: number | null;
  maxDistanceKm: number | null;
  damageGrade: DamageGrade | "ALL";
  searchQuery: string;
  sortBy: "closing_soon" | "mileage_low" | "year_new" | "distance_near";
};

export type DealerBidSubmission = {
  auctionId: string;
  bidAmountCents: number; // Integer CAD cents invariant
  certifiedDeclaration: boolean;
  idempotencyKey?: string;
  conditions?: string;
  notes?: string;
};

export type DealerBidReceipt = {
  success: true;
  idempotent: boolean;
  bidId: string;
  auctionId: string;
  bidAmountCents: number;
  version: number;
  revisionCount: number;
  placedAt: string;
  message: string;
};

export type DealerActiveBidStanding =
  | "SOLE_BIDDER"
  | "COMPETING"
  | "CLOSING_SOON"
  | "AWAITING_SELLER";

export type DealerActiveBidItem = WholesaleAuctionItem & {
  bidId: string;
  bidStatus: "ACTIVE" | "WON" | "LOST" | "EXPIRED" | "WITHDRAWN" | "VOIDED";
  listingStatus: string;
  revisionCount: number;
  placedAt: string;
  bidStanding: DealerActiveBidStanding;
};

export type DealerActiveBidsSummary = {
  totalCommittedCents: number; // Integer CAD cents invariant
  activeBidsCount: number;
  closingSoonCount: number;
  awaitingSellerCount: number;
};

export type DealerActiveBidsResponse = {
  items: DealerActiveBidItem[];
  summary: DealerActiveBidsSummary;
  dealershipName: string;
  serverTime: string;
};

export type WonMatchStatus =
  | "APPOINTMENT_CONFIRMED"
  | "COMPLETED"
  | "RENEGOTIATED_LOWER"
  | "NO_SHOW"
  | "DECLINED_AFTER_INSPECTION"
  | "EXPIRED";

export type WonMatchItem = {
  id: string;
  listingId: string;
  voucherCode: string;
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    mileageKm: number;
    thumbnailUrl: string;
    damageGrade: string;
    auctionId: string;
  };
  seller: {
    name: string;
    phone: string;
    email: string;
    city: string;
    province: string;
    postalCode: string;
    kycVerified: boolean;
  };
  acceptedBidAmountCents: number; // Integer CAD cents invariant
  wonAt: string;
  appointmentWindowExpiresAt: string;
  status: WonMatchStatus;
  finalTransactionCents?: number | null;
  inspectionNotes?: string | null;
  outcomeLoggedAt?: string | null;
  appointmentLocation: string;
};

export type DealerWonMatchesSummary = {
  totalWonValueCents: number;
  totalWonCount: number;
  scheduledCount: number;
  completedCount: number;
  totalSettledValueCents: number;
};

export type DealerWonMatchesResponse = {
  items: WonMatchItem[];
  summary: DealerWonMatchesSummary;
  dealershipName: string;
  serverTime: string;
};

export type LogMatchOutcomeValue =
  | "APPOINTMENT_CONFIRMED"
  | "COMPLETED"
  | "RENEGOTIATED_LOWER"
  | "NO_SHOW"
  | "DECLINED_AFTER_INSPECTION";

export type LogMatchOutcomePayload = {
  outcome: LogMatchOutcomeValue;
  finalPriceCents?: number | null;
  notes?: string;
};

export type LogMatchOutcomeResponse = {
  match: WonMatchItem;
  listingStatus: string;
  auditAction: string;
  message: string;
  serverTime: string;
};

export type DealerRegulatorCode = "OMVIC" | "AMVIC" | "VSA" | "OPC";

export type DealershipLifecycleStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "REVOKED";

export type DealerOnboardingApplication = {
  id: string;
  dealershipName: string;
  legalEntityName: string;
  regulator: DealerRegulatorCode;
  licenseNumber: string;
  licenseExpiry: string | null;
  businessNumber: string | null;
  status: DealershipLifecycleStatus;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: number;
  contactName: string;
  contactTitle: string | null;
  contactEmail: string;
  contactPhone: string;
  verificationNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DealerOnboardingStatusResponse = {
  application: DealerOnboardingApplication | null;
  prefill: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    postalCode: string;
    province: string;
    city: string;
    role: string;
  };
  canEdit: boolean;
  serverTime: string;
};

export type SubmitDealershipApplicationPayload = {
  dealershipName: string;
  legalEntityName: string;
  regulator: DealerRegulatorCode;
  licenseNumber: string;
  licenseExpiry?: string | null;
  businessNumber?: string | null;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  serviceRadiusKm: number;
  contactName: string;
  contactTitle?: string | null;
  contactEmail: string;
  contactPhone: string;
  agreeOmvicEthics: true;
};

export type DealerSeatRole =
  | "DEALER_ADMIN"
  | "DEALER_BUYER"
  | "DEALER_INSPECTOR";

export type DealerTeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  role: DealerSeatRole;
  isSelf: boolean;
  joinedAt: string;
  joinedAtIso: string;
  lastActive: string;
  lastActiveAtIso: string | null;
};

export type DealerTeamSummary = {
  seatsUsed: number;
  maxSeats: number;
  planName: string;
  adminsCount: number;
  buyersCount: number;
  inspectorsCount: number;
};

export type DealerTeamResponse = {
  members: DealerTeamMember[];
  summary: DealerTeamSummary;
  dealershipName: string;
  currentUserId: string;
  serverTime: string;
};

export type InviteDealerMemberPayload = {
  name: string;
  email: string;
  seatRole: DealerSeatRole;
  jobTitle?: string | null;
};

export type UpdateDealerMemberRolePayload = {
  seatRole: DealerSeatRole;
};

export type DealerTeamMutationResponse = {
  member?: DealerTeamMember;
  removedMemberId?: string;
  summary: DealerTeamSummary;
  message: string;
  serverTime: string;
};
