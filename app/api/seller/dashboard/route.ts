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
      activeAuctionsCount: 2,
      totalBidsReceived: 54, // Aggregate across active + past auctions
      completedSalesCount: 1,
      totalValueEarnedCents: 3650000, // $36,500.00 CAD integer cents
    },
    auctions: [
      {
        id: "auc-toyota-4runner-2025",
        vin: "JTEBU5JR8R5091823",
        year: 2025,
        make: "Toyota",
        model: "4Runner",
        trim: "TRD Pro 4WD",
        mileageKm: 8450,
        status: "ACTIVE",
        thumbnailUrl: "/showcase-cars-with-bg/2025-Toyota-4runner.png",
        reservePriceCents: 5890000, // $58,900.00 CAD
        bidCount: 18, // Sealed-bid invariant: count only
        auctionStartedAt: startedAtIso,
        auctionEndsAt: endsAtIso,
        province: userProvince,
        city: "Brampton",
        createdAt: startedAtIso,
      },
      {
        id: "auc-honda-civic-2024",
        vin: "2HGFL1H87RH512940",
        year: 2024,
        make: "Honda",
        model: "Civic",
        trim: "Touring Sedan",
        mileageKm: 14200,
        status: "ACTIVE",
        thumbnailUrl: "/showcase-cars-with-bg/2024-Honda-Civic.webp",
        reservePriceCents: 2740000, // $27,400.00 CAD
        bidCount: 14,
        auctionStartedAt: startedAtIso,
        auctionEndsAt: endsAtIso,
        province: userProvince,
        city: "Toronto",
        createdAt: startedAtIso,
      },
      {
        id: "auc-ford-bronco-2024",
        vin: "1FMEE5DP6PLA89124",
        year: 2024,
        make: "Ford",
        model: "Bronco",
        trim: "Badlands Sasquatch",
        mileageKm: 26100,
        status: "PENDING_MODERATION",
        thumbnailUrl: "/showcase-cars-with-bg/2022-Ford-Bronco.webp",
        reservePriceCents: 5150000, // $51,500.00 CAD
        bidCount: 0,
        province: userProvince,
        city: "Vancouver",
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "auc-jeep-wrangler-2024",
        vin: "1C4HJXFN8MW204812",
        year: 2024,
        make: "Jeep",
        model: "Wrangler",
        trim: "Rubicon 4xe PHEV",
        mileageKm: 19800,
        status: "COMPLETED",
        thumbnailUrl: "/plain-cars-images/image_38.webp",
        reservePriceCents: 4680000, // $46,800.00 CAD
        bidCount: 21,
        province: userProvince,
        city: "Montreal",
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
