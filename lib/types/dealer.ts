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
};
