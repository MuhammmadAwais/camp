export type AuctionStatus =
  | "DRAFT"
  | "PENDING_MODERATION"
  | "ACTIVE"
  | "UNSEALED"
  | "ACCEPTED"
  | "COMPLETED"
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
};
