import { NextResponse, type NextRequest } from "next/server";
import { mockApiDisabled, ok, simulateLatency } from "@/lib/mock/http";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";

// In-memory bid tracking for active demo session
const dealerBids = new Map<string, number>();

export async function GET(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  await simulateLatency(200);

  const now = Date.now();

  const inventory: WholesaleAuctionItem[] = [
    {
      id: "auc-porsche-macan-2022",
      vin: "WP1AF2AY5NL128491",
      year: 2022,
      make: "Porsche",
      model: "Macan",
      trim: "GTS AWD",
      mileageKm: 38450,
      bodyType: "Compact SUV",
      transmission: "7-Speed Dual-Clutch PDK",
      drivetrain: "All-Wheel Drive (AWD)",
      exteriorColor: "Volcano Grey Metallic",
      interiorColor: "Black Leather",
      province: "ON",
      city: "Toronto",
      postalCode: "M5V 2T6",
      distanceKm: 12,
      damageGrade: "A",
      damageHotspotCount: 1,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      ],
      photosCount: 16,
      auctionEndsAt: new Date(now + (17 * 60 + 42) * 60 * 1000).toISOString(),
      myCurrentBidCents: dealerBids.get("auc-porsche-macan-2022") ?? 3825000,
      totalBidsPlaced: 14,
      reserveStatus: "RESERVE_MET",
      carfaxClean: true,
      keysCount: 2,
      hasLien: false,
    },
    {
      id: "auc-tesla-modely-2023",
      vin: "5YJ3E1EA8PF412345",
      year: 2023,
      make: "Tesla",
      model: "Model Y",
      trim: "Long Range AWD",
      mileageKm: 24100,
      bodyType: "Electric SUV",
      transmission: "1-Speed Direct-Drive",
      drivetrain: "Dual-Motor AWD",
      exteriorColor: "Pearl White Multi-Coat",
      interiorColor: "All Black",
      province: "ON",
      city: "Mississauga",
      postalCode: "L5B 2C9",
      distanceKm: 22,
      damageGrade: "A",
      damageHotspotCount: 0,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
      ],
      photosCount: 14,
      auctionEndsAt: new Date(now + (4 * 60 + 15) * 60 * 1000).toISOString(),
      myCurrentBidCents: dealerBids.get("auc-tesla-modely-2023") ?? null,
      totalBidsPlaced: 19,
      reserveStatus: "RESERVE_MET",
      carfaxClean: true,
      keysCount: 2,
      hasLien: false,
    },
    {
      id: "auc-ford-f150-2021",
      vin: "1FTFW1E84MFA12345",
      year: 2021,
      make: "Ford",
      model: "F-150",
      trim: "Lariat 502A SuperCrew",
      mileageKm: 54300,
      bodyType: "Pickup Truck",
      transmission: "10-Speed Automatic",
      drivetrain: "4x4 / Four-Wheel Drive",
      exteriorColor: "Agate Black Metallic",
      interiorColor: "Black Leather",
      province: "ON",
      city: "Vaughan",
      postalCode: "L4K 4T9",
      distanceKm: 18,
      damageGrade: "B",
      damageHotspotCount: 2,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      ],
      photosCount: 20,
      auctionEndsAt: new Date(now + (11 * 60 + 50) * 60 * 1000).toISOString(),
      myCurrentBidCents: dealerBids.get("auc-ford-f150-2021") ?? 3250000,
      totalBidsPlaced: 8,
      reserveStatus: "NO_RESERVE",
      carfaxClean: true,
      keysCount: 2,
      hasLien: false,
    },
    {
      id: "auc-bmw-m340i-2023",
      vin: "WBA5R7C09NF123456",
      year: 2023,
      make: "BMW",
      model: "M340i",
      trim: "xDrive Sedan",
      mileageKm: 19800,
      bodyType: "Sports Sedan",
      transmission: "8-Speed Sport Steptronic",
      drivetrain: "xDrive All-Wheel Drive",
      exteriorColor: "Portimao Blue Metallic",
      interiorColor: "Cognac Vernasca",
      province: "ON",
      city: "Oakville",
      postalCode: "L6H 7S8",
      distanceKm: 34,
      damageGrade: "A",
      damageHotspotCount: 0,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      ],
      photosCount: 18,
      auctionEndsAt: new Date(now + (0 * 60 + 12) * 60 * 1000).toISOString(), // Sub-15min Crimson urgency state!
      myCurrentBidCents: dealerBids.get("auc-bmw-m340i-2023") ?? null,
      totalBidsPlaced: 23,
      reserveStatus: "RESERVE_MET",
      carfaxClean: true,
      keysCount: 2,
      hasLien: false,
    },
    {
      id: "auc-toyota-rav4-2024",
      vin: "2T3P1RFV5PW123456",
      year: 2024,
      make: "Toyota",
      model: "RAV4",
      trim: "Hybrid XLE AWD",
      mileageKm: 11200,
      bodyType: "Compact SUV",
      transmission: "eCVT Electronically Controlled",
      drivetrain: "Electronic On-Demand AWD",
      exteriorColor: "Magnetic Grey Metallic",
      interiorColor: "Ash Fabric",
      province: "QC",
      city: "Montreal",
      postalCode: "H3A 1G1",
      distanceKm: 145,
      damageGrade: "A",
      damageHotspotCount: 0,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
      ],
      photosCount: 12,
      auctionEndsAt: new Date(now + (21 * 60 + 30) * 60 * 1000).toISOString(),
      myCurrentBidCents: dealerBids.get("auc-toyota-rav4-2024") ?? null,
      totalBidsPlaced: 11,
      reserveStatus: "RESERVE_PENDING",
      carfaxClean: true,
      keysCount: 2,
      hasLien: false,
    },
  ];

  return ok({
    items: inventory,
    totalCount: inventory.length,
    dealerQuota: {
      usedThisMonth: 14,
      totalMonthlyQuota: 50,
      activeBidsCount: Array.from(dealerBids.keys()).length + 2,
    },
  });
}
