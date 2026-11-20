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

export type DisputeCategory =
  | "UNDERBODY_DAMAGE"
  | "MISSING_KEYS"
  | "MECHANICAL_POWERTRAIN"
  | "ODOMETER_DISCREPANCY"
  | "UNRESOLVED_LIEN";

export type DisputeStatus =
  | "INVESTIGATING"
  | "ACTION_REQUIRED"
  | "RESOLVED"
  | "CLOSED";

export type DisputeResolutionDecision =
  | "APPROVE_ADJUSTMENT"
  | "REJECT_CLAIM"
  | "MUTUAL_CANCEL";

export type DisputePhoto = {
  url: string;
  label: string;
  isHoistEvidence?: boolean;
  storagePath?: string | null;
};

export type DisputeTimelineEntry = {
  timestamp: string;
  timestampIso: string;
  actor: string;
  action: string;
  note: string;
};

export type DisputeItem = {
  id: string;
  docketNumber: string;
  matchId: string;
  listingId: string;
  openedAt: string;
  openedDateFormatted: string;
  status: DisputeStatus;
  category: DisputeCategory;
  categoryLabel: string;
  agreedBidCents: number; // Integer CAD cents invariant
  disputedAdjustmentCents: number; // Integer CAD cents requested deduction
  netSettlementCents: number; // agreedBidCents - disputedAdjustmentCents
  allegationSummary: string;
  hoistEvidenceNotes: string;
  complianceDecisionNotes?: string | null;
  resolutionDecision?: DisputeResolutionDecision | null;
  resolvedAt?: string | null;
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    province: string;
    declaredConditionGrade: string;
  };
  dealership: {
    id: string;
    name: string;
    legalEntity: string;
    regulator: AdminDealerRegulator;
    licenseNumber: string;
    contactOfficer: string;
    technician: string;
    city: string;
    province: string;
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
    thumbnailUrl: string;
    photos: DisputePhoto[];
  };
  timeline: DisputeTimelineEntry[];
};

export type DisputeQueueCounts = {
  ALL: number;
  INVESTIGATING: number;
  ACTION_REQUIRED: number;
  RESOLVED: number;
  CLOSED: number;
};

export type AdminDisputesResponse = {
  items: DisputeItem[];
  counts: DisputeQueueCounts;
  serverTime: string;
};

export type DisputeEvidencePresignPayload = {
  matchId: string;
  fileName: string;
  contentType:
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/heic"
    | "image/heif"
    | "application/pdf";
  fileSizeBytes: number;
};

export type DisputeEvidencePresignResponse = {
  uploadUrl: string;
  token: string;
  storagePath: string;
  expiresInSeconds: number;
};

export type OpenDisputePayload = {
  matchId: string;
  category: DisputeCategory;
  disputedAdjustmentCents: number;
  allegationSummary: string;
  hoistEvidenceNotes?: string;
  technicianName?: string;
  evidencePhotos?: Array<{
    url?: string;
    storagePath?: string;
    label: string;
    isHoistEvidence?: boolean;
  }>;
};

export type ResolveDisputePayload = {
  decision: DisputeResolutionDecision;
  adjustmentCents?: number;
  notes: string;
};

export type ResolveDisputeResult = {
  dispute: DisputeItem;
  decision: DisputeResolutionDecision;
  matchOutcome: string;
  listingStatus: string;
  auditAction: string;
  message: string;
  serverTime: string;
};

export type AnalyticsTimeRange = "7D" | "30D" | "90D" | "YTD";

export type AnalyticsDailyTrendPoint = {
  bucketStart: string;
  day: string;
  dateStr: string;
  volumeCents: number; // Integer CAD cents invariant
  reserveFloorCents: number; // Integer CAD cents invariant
  bidsCount: number;
  lotsCleared: number;
};

export type ProvincialMarketShare = {
  province: string;
  code: string;
  regulator: AdminDealerRegulator | string;
  volumeCents: number; // Integer CAD cents invariant
  sharePercent: number;
  dealersCount: number;
  lotsCount: number;
  clearedLotsCount: number;
  avgSurplusCents: number; // Integer CAD cents invariant
};

export type MetroVelocityBar = {
  city: string;
  provinceCode: string;
  intakeLots: number;
  clearedLots: number;
  clearancePercent: number;
};

export type LeaderboardDealer = {
  rank: number;
  dealershipId: string;
  name: string;
  entity: string;
  regulator: AdminDealerRegulator | string;
  licenseNumber: string;
  province: string;
  lotsWon: number;
  bidsPlaced: number;
  volumeCents: number; // Integer CAD cents invariant
  growthPercent: number;
  monogram: string;
};

export type WholesaleSettlementRecord = {
  id: string;
  listingId: string;
  voucherCode: string;
  vehicle: string;
  vin: string;
  buyer: string;
  regulator: string;
  province: string;
  amountCents: number; // Integer CAD cents invariant
  surplusCents: number; // Integer CAD cents invariant
  completedAtIso: string;
  status: "SETTLED" | "ESCROW_CLEARED";
  outcome: string;
};

export type AdminAnalyticsKpis = {
  totalVolumeCents: number; // Integer CAD cents invariant
  previousVolumeCents: number; // Integer CAD cents invariant
  gmvGrowthPercent: number;
  totalTransactionsCount: number;
  totalListingsCount: number;
  eligibleClosedListingsCount: number;
  clearedLotsCount: number;
  clearanceRatePercent: number;
  averageBidsPerLot: number;
  averageSellerSurplusCents: number; // Integer CAD cents invariant
  activeDealerCount: number;
  activeAuctionsCount: number;
  totalBidsCount: number;
};

export type AdminAnalyticsResponse = {
  range: AnalyticsTimeRange;
  province: string;
  kpis: AdminAnalyticsKpis;
  trend: AnalyticsDailyTrendPoint[];
  provincialShare: ProvincialMarketShare[];
  metroVelocity: MetroVelocityBar[];
  dealerLeaderboard: LeaderboardDealer[];
  settlements: WholesaleSettlementRecord[];
  serverTime: string;
};

export type AuditChainIntegrity = {
  valid: boolean;
  totalRows: number;
  verifiedRows: number;
  invalidRows: number;
  integrityPercent: number;
  latestHash: string | null;
  firstBrokenId: number | null;
};

export type AuditLogSummaryCounts = {
  total: number;
  overrides: number;
  bids: number;
  approvals: number;
  disputes: number;
};

export type AuditLogFacets = {
  actions: string[];
  entityTypes: string[];
  provinces: string[];
};

export type AuditLogItem = {
  id: number;
  timestamp: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  provincialJurisdiction: string;
  details: string;
  immutableHash: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
};

export type AdminAuditActionGroup =
  | "ALL"
  | "OVERRIDES"
  | "BIDS"
  | "APPROVALS"
  | "DISPUTES";

export type AdminAuditLogFilters = {
  page?: number;
  pageSize?: number;
  action?: string;
  actionGroup?: AdminAuditActionGroup;
  entityType?: string;
  province?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type AdminAuditLogResponse = {
  items: AuditLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  integrity: AuditChainIntegrity;
  counts: AuditLogSummaryCounts;
  facets: AuditLogFacets;
  serverTime: string;
};
