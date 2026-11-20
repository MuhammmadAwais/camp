export type AuctionStatus =
  | "DRAFT"
  | "PENDING_MODERATION"
  | "EDITS_REQUESTED"
  | "REJECTED"
  | "ACTIVE"
  | "UNSEALED"
  | "ACCEPTED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type SellerAuctionItem = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileageKm: number;
  status: AuctionStatus;
  thumbnailUrl: string;
  reservePriceCents: number; // Integer CAD cents invariant
  bidCount: number; // Sealed-bid invariant: count only, zero dollar values exposed while ACTIVE
  auctionStartedAt?: string;
  auctionEndsAt?: string;
  closedAt?: string;
  province: string;
  city: string;
  createdAt: string;
};

export type SellerDashboardStats = {
  activeAuctionsCount: number;
  totalBidsReceived: number; // Sealed bid count aggregate
  completedSalesCount: number;
  totalValueEarnedCents: number; // Integer CAD cents
};

export type SellerNotificationType = "BID" | "KYC" | "MODERATION" | "SYSTEM";

export type SellerNotificationItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: SellerNotificationType;
  read: boolean;
  listingId?: string;
};

export type SellerDashboardData = {
  stats: SellerDashboardStats;
  auctions: SellerAuctionItem[];
  notifications: SellerNotificationItem[];
  serverTime?: string;
};

export type UnsealedDealerBid = {
  id: string;
  dealershipId: string;
  dealershipName: string;
  omvicNumber: string;
  province: string;
  city: string;
  rating: number;
  reviewCount: number;
  bidAmountCents: number; // Integer CAD cents invariant
  distanceKm: number;
  placedAt: string;
  payoutSpeedDays: number;
  certifiedPreInspection: boolean;
};

export type AppointmentVoucher = {
  matchId?: string;
  voucherCode: string;
  dealershipName: string;
  licenseNumber?: string;
  regulator?: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPhone: string;
  contactEmail: string;
  operatingHours: string;
  acceptedOfferCents: number; // Integer CAD cents invariant
  expiresAt: string;
  checklist: string[];
};

export type OfferSelectionReason = "HIGHEST" | "NEAREST" | "OTHER";

export type AcceptOfferPayload = {
  bidId: string;
  selectionReason?: OfferSelectionReason;
};

export type AcceptOfferResponse = {
  matchId: string;
  listingId: string;
  status: "ACCEPTED";
  voucher: AppointmentVoucher;
};

export type ListingDetailData = {
  auction: SellerAuctionItem;
  photos: Array<{ id: string; url: string; isCover: boolean }>;
  damageHotspots: Array<{
    id: string;
    panel: string;
    severity: "MINOR" | "MODERATE" | "SEVERE";
    description?: string;
  }>;
  specs: {
    transmission?: string;
    drivetrain?: string;
    exteriorColor?: string;
    interiorColor?: string;
    keysCount: number;
    hasLien: boolean;
    accidentDeclaration: boolean;
  };
  serverTime?: string;
  unsealedBids?: UnsealedDealerBid[];
  selectedBid?: UnsealedDealerBid;
  appointmentVoucher?: AppointmentVoucher;
};
