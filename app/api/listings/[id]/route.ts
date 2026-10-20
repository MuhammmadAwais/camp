import { NextResponse, type NextRequest } from "next/server";
import { mockApiDisabled, ok, fail, simulateLatency } from "@/lib/mock/http";
import type { ListingDetailData, UnsealedDealerBid } from "@/lib/types/seller";

// In-memory state for demo acceptance
const acceptedAuctions = new Map<string, string>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const { id } = await params;
  await simulateLatency(200);

  const { searchParams } = new URL(request.url);
  const forceStatus = searchParams.get("status");

  // Determine state
  const isAccepted = acceptedAuctions.has(id);
  const now = Date.now();
  const endsAtIso = new Date(now + (17 * 60 + 42) * 60 * 1000).toISOString();
  const startedAtIso = new Date(now - (6 * 60 + 18) * 60 * 1000).toISOString();

  const unsealedBids: UnsealedDealerBid[] = [
    {
      id: "bid-pfaff-porsche",
      dealershipId: "dlr-pfaff-auto",
      dealershipName: "Pfaff Porsche Woodbridge",
      omvicNumber: "OMVIC-481920",
      province: "ON",
      city: "Woodbridge",
      rating: 4.9,
      reviewCount: 312,
      bidAmountCents: 3825000, // $38,250 CAD
      distanceKm: 14,
      placedAt: new Date(now - 45 * 60 * 1000).toISOString(),
      payoutSpeedDays: 1,
      certifiedPreInspection: true,
    },
    {
      id: "bid-oakville-motors",
      dealershipId: "dlr-oakville-luxury",
      dealershipName: "Oakville Luxury Motor Group",
      omvicNumber: "OMVIC-391204",
      province: "ON",
      city: "Oakville",
      rating: 4.8,
      reviewCount: 184,
      bidAmountCents: 3790000, // $37,900 CAD
      distanceKm: 32,
      placedAt: new Date(now - 120 * 60 * 1000).toISOString(),
      payoutSpeedDays: 1,
      certifiedPreInspection: true,
    },
    {
      id: "bid-toronto-automall",
      dealershipId: "dlr-toronto-automall",
      dealershipName: "Downtown Toronto Auto Mall",
      omvicNumber: "OMVIC-219582",
      province: "ON",
      city: "Toronto",
      rating: 4.7,
      reviewCount: 420,
      bidAmountCents: 3740000, // $37,400 CAD
      distanceKm: 6,
      placedAt: new Date(now - 240 * 60 * 1000).toISOString(),
      payoutSpeedDays: 2,
      certifiedPreInspection: false,
    },
    {
      id: "bid-mississauga-imports",
      dealershipId: "dlr-mississauga-imports",
      dealershipName: "Mississauga Premier Imports",
      omvicNumber: "OMVIC-583921",
      province: "ON",
      city: "Mississauga",
      rating: 4.6,
      reviewCount: 96,
      bidAmountCents: 3680000, // $36,800 CAD
      distanceKm: 24,
      placedAt: new Date(now - 360 * 60 * 1000).toISOString(),
      payoutSpeedDays: 2,
      certifiedPreInspection: false,
    },
  ];

  const selectedBidId = acceptedAuctions.get(id) || unsealedBids[0].id;
  const selectedBid = unsealedBids.find((b) => b.id === selectedBidId) || unsealedBids[0];

  const status = isAccepted
    ? "ACCEPTED"
    : forceStatus
    ? (forceStatus as any)
    : id.includes("unsealed")
    ? "UNSEALED"
    : "ACTIVE";

  const payload: ListingDetailData = {
    auction: {
      id,
      vin: "WP1AF2AY5NL128491",
      year: 2022,
      make: "Porsche",
      model: "Macan",
      trim: "GTS AWD",
      mileageKm: 38450,
      status,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      reservePriceCents: 3650000, // $36,500 CAD integer cents
      bidCount: 14, // Sealed count
      auctionStartedAt: startedAtIso,
      auctionEndsAt: endsAtIso,
      province: "ON",
      city: "Toronto",
      createdAt: startedAtIso,
    },
    photos: [
      {
        id: "p1",
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        isCover: true,
      },
      {
        id: "p2",
        url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
        isCover: false,
      },
      {
        id: "p3",
        url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
        isCover: false,
      },
      {
        id: "p4",
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
        isCover: false,
      },
    ],
    damageHotspots: [
      {
        id: "d1",
        panel: "Rear Passenger Bumper",
        severity: "MINOR",
        description: "Small 2cm clearcoat surface scratch from curb parking.",
      },
      {
        id: "d2",
        panel: "Driver Side Door Edge",
        severity: "MINOR",
        description: "Minor paint chip along door lip.",
      },
    ],
    specs: {
      transmission: "7-Speed Dual-Clutch PDK",
      drivetrain: "All-Wheel Drive (AWD)",
      exteriorColor: "Volcano Grey Metallic",
      interiorColor: "Black Leather with Carmine Red Stitching",
      keysCount: 2,
      hasLien: false,
      accidentDeclaration: false,
    },
    unsealedBids,
    selectedBid: isAccepted ? selectedBid : undefined,
    appointmentVoucher: isAccepted
      ? {
          voucherCode: `AN-2026-${id.slice(-4).toUpperCase()}-ON`,
          dealershipName: selectedBid.dealershipName,
          address: "105 Four Valley Drive",
          city: selectedBid.city,
          province: selectedBid.province,
          postalCode: "L4K 4T9",
          contactPhone: "(905) 851-0852",
          contactEmail: "purchasing@pfaffporsche.com",
          operatingHours: "Monday – Saturday: 9:00 AM – 6:00 PM EST",
          acceptedOfferCents: selectedBid.bidAmountCents,
          expiresAt: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
          checklist: [
            "Original Vehicle Ownership Permit (Green Slip - Part 1 & 2)",
            "Two original master vehicle smart keys",
            "Government-issued photo identification (Driver's License)",
            "Direct Deposit void cheque or wire payout instructions",
          ],
        }
      : undefined,
  };

  return ok(payload);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const { id } = await params;
  await simulateLatency(300);

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const { bidId } = body;
  acceptedAuctions.set(id, bidId || "bid-pfaff-porsche");

  return ok({
    success: true,
    listingId: id,
    status: "ACCEPTED",
    message: "Dealership offer successfully accepted. Offline inspection appointment voucher generated.",
  });
}
