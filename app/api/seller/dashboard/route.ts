import { type NextRequest } from "next/server";
import { mockApiDisabled, ok, requireUser, simulateLatency } from "@/lib/mock/http";
import type { SellerDashboardData } from "@/lib/types/seller";

export async function GET(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  // Verify auth session (falls back to demo seller in development mock mode)
  const user = requireUser(request);
  const userProvince = user instanceof Response ? "ON" : user.province || "ON";

  await simulateLatency(250);

  // Optional ?view=empty query parameter for previewing zero-state onboarding
  const { searchParams } = new URL(request.url);
  const isEmptyView = searchParams.get("view") === "empty";

  if (isEmptyView) {
    const emptyPayload: SellerDashboardData = {
      stats: {
        activeAuctionsCount: 0,
        totalBidsReceived: 0,
        completedSalesCount: 0,
        totalValueEarnedCents: 0,
      },
      auctions: [],
      notifications: [
        {
          id: "notif-kyc-welcome",
          title: "Welcome to AutoNexa",
          description: "Verify your identity to unlock licensed dealer bidding and list your first vehicle.",
          timestamp: new Date().toISOString(),
          type: "KYC",
          read: false,
        },
      ],
    };
    return ok(emptyPayload);
  }

  // Authoritative 24-hour auction end timestamp (17h 42m from now)
  const now = Date.now();
  const endsAtIso = new Date(now + (17 * 60 + 42) * 60 * 1000).toISOString();
  const startedAtIso = new Date(now - (6 * 60 + 18) * 60 * 1000).toISOString();

  const payload: SellerDashboardData = {
    stats: {
      activeAuctionsCount: 1,
      totalBidsReceived: 36, // Aggregate across active + past auctions
      completedSalesCount: 1,
      totalValueEarnedCents: 3650000, // $36,500.00 CAD integer cents
    },
    auctions: [
      {
        id: "auc-porsche-macan-2022",
        vin: "WP1AF2AY5NL128491",
        year: 2022,
        make: "Porsche",
        model: "Macan",
        trim: "GTS All-Wheel Drive",
        mileageKm: 42500,
        status: "ACTIVE",
        thumbnailUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        reservePriceCents: 6850000, // $68,500.00 CAD
        bidCount: 14, // Sealed-bid invariant: strictly count only
        auctionStartedAt: startedAtIso,
        auctionEndsAt: endsAtIso,
        province: userProvince,
        city: "Toronto",
        createdAt: startedAtIso,
      },
      {
        id: "auc-bmw-m340i-2021",
        vin: "3MW5R7J07M8B99124",
        year: 2021,
        make: "BMW",
        model: "3 Series",
        trim: "M340i xDrive Sedan",
        mileageKm: 38100,
        status: "PENDING_MODERATION",
        thumbnailUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
        reservePriceCents: 4900000, // $49,000.00 CAD
        bidCount: 0,
        province: userProvince,
        city: "Mississauga",
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "auc-audi-q5-2020",
        vin: "WA1ANAFY7L2048123",
        year: 2020,
        make: "Audi",
        model: "Q5",
        trim: "45 TFSI quattro Technik",
        mileageKm: 64200,
        status: "COMPLETED",
        thumbnailUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80",
        reservePriceCents: 3400000, // $34,000.00 CAD
        bidCount: 22,
        province: userProvince,
        city: "Oakville",
        createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    notifications: [
      {
        id: "notif-01",
        title: "New sealed dealer bid received",
        description: "A vetted franchise dealership submitted a competitive sealed bid on your 2022 Porsche Macan GTS.",
        timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
        type: "BID",
        read: false,
        listingId: "auc-porsche-macan-2022",
      },
      {
        id: "notif-02",
        title: "Moderation review in progress",
        description: "AutoNexa appraisal specialists are reviewing your 2021 BMW M340i. 24h auction countdown begins upon approval.",
        timestamp: new Date(now - 110 * 60 * 1000).toISOString(),
        type: "MODERATION",
        read: false,
        listingId: "auc-bmw-m340i-2021",
      },
      {
        id: "notif-03",
        title: "Dealership settlement completed",
        description: "Transaction voucher for Audi Q5 confirmed by Audi Midtown Toronto. Funds transferred via certified draft.",
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: "SYSTEM",
        read: true,
        listingId: "auc-audi-q5-2020",
      },
      {
        id: "notif-04",
        title: "Identity verified successfully",
        description: "Your government ID was verified. Your listings now feature verified seller status.",
        timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "KYC",
        read: true,
      },
    ],
  };

  return ok(payload);
}
