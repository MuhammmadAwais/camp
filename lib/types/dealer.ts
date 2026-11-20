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
