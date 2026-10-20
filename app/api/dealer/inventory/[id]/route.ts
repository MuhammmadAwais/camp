import { NextResponse, type NextRequest } from "next/server";
import { mockApiDisabled, ok, fail, simulateLatency } from "@/lib/mock/http";
import type { WholesaleAuctionItem } from "@/lib/types/dealer";

// Shared dealer inventory items database mock
const INVENTORY_DATABASE: Record<string, WholesaleAuctionItem & {
  engineSpec: string;
  horsepower: number;
  fuelType: string;
  carfaxReport: {
    ownersCount: number;
    accidentFree: boolean;
    serviceRecordsCount: number;
    lastReportedCity: string;
    registrationProvince: string;
    odometerRollbackRisk: boolean;
  };
  damageHotspots: Array<{
    id: string;
    panel: string;
    severity: "MINOR" | "MODERATE" | "SEVERE";
    description: string;
    imageUrl?: string;
  }>;
  sellerNotes: string;
}> = {
  "auc-porsche-macan-2022": {
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
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=80",
    ],
    photosCount: 16,
    auctionEndsAt: new Date(Date.now() + (17 * 60 + 42) * 60 * 1000).toISOString(),
    myCurrentBidCents: 3825000,
    totalBidsPlaced: 14,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    engineSpec: "2.9L Twin-Turbo V6",
    horsepower: 434,
    fuelType: "Premium Gasoline (91+)",
    carfaxReport: {
      ownersCount: 1,
      accidentFree: true,
      serviceRecordsCount: 6,
      lastReportedCity: "Toronto, ON",
      registrationProvince: "Ontario (OMVIC Clean)",
      odometerRollbackRisk: false,
    },
    damageHotspots: [
      {
        id: "dmg-1",
        panel: "Rear Bumper Lower Lip",
        severity: "MINOR",
        description: "Small 2cm cosmetic scuff on lower grey diffuser plastic. Surface only, no structural fracture.",
        imageUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
      },
    ],
    sellerNotes:
      "Single-owner executive lease return. Garaged indoors year-round in downtown Toronto. Full Porsche Centre Oakville service history records available in glovebox. Both OEM fobs and summer Michelin Pilot Sport 4S tires included.",
  },
  "auc-tesla-modely-2023": {
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
    interiorColor: "All Black Premium",
    province: "ON",
    city: "Mississauga",
    postalCode: "L5B 2C9",
    distanceKm: 22,
    damageGrade: "A",
    damageHotspotCount: 0,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80",
    ],
    photosCount: 14,
    auctionEndsAt: new Date(Date.now() + (4 * 60 + 15) * 60 * 1000).toISOString(),
    myCurrentBidCents: null,
    totalBidsPlaced: 19,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    engineSpec: "Dual Permanent Magnet Electric Motors",
    horsepower: 384,
    fuelType: "Battery Electric (EV)",
    carfaxReport: {
      ownersCount: 1,
      accidentFree: true,
      serviceRecordsCount: 2,
      lastReportedCity: "Mississauga, ON",
      registrationProvince: "Ontario",
      odometerRollbackRisk: false,
    },
    damageHotspots: [],
    sellerNotes:
      "Pristine battery health (97% rated capacity on Tesla app diagnostics). Mobile charger, two key cards, and Tesla OEM rubber all-weather mats included.",
  },
  "auc-ford-f150-2021": {
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
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1600&q=80",
    ],
    photosCount: 20,
    auctionEndsAt: new Date(Date.now() + (11 * 60 + 50) * 60 * 1000).toISOString(),
    myCurrentBidCents: 3250000,
    totalBidsPlaced: 8,
    reserveStatus: "NO_RESERVE",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    engineSpec: "3.5L EcoBoost Twin-Turbo V6",
    horsepower: 400,
    fuelType: "Regular Unleaded (87)",
    carfaxReport: {
      ownersCount: 1,
      accidentFree: true,
      serviceRecordsCount: 9,
      lastReportedCity: "Vaughan, ON",
      registrationProvince: "Ontario",
      odometerRollbackRisk: false,
    },
    damageHotspots: [
      {
        id: "dmg-f150-1",
        panel: "Tailgate Center",
        severity: "MINOR",
        description: "Small shallow dent near tailgate handle from trailer hitch connection.",
      },
      {
        id: "dmg-f150-2",
        panel: "Right Rear Bed Fender",
        severity: "MODERATE",
        description: "5cm scratch through clearcoat on rear right wheel arch.",
      },
    ],
    sellerNotes:
      "Spray-in bedliner, panoramic moonroof, Bang & Olufsen sound system. No heavy commercial towing history. Fresh synthetic oil service done 2 weeks ago.",
  },
  "auc-bmw-m340i-2023": {
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
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80",
    ],
    photosCount: 18,
    auctionEndsAt: new Date(Date.now() + (0 * 60 + 12) * 60 * 1000).toISOString(),
    myCurrentBidCents: null,
    totalBidsPlaced: 23,
    reserveStatus: "RESERVE_MET",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    engineSpec: "3.0L B58 Turbocharged Inline-6 with 48V Mild Hybrid",
    horsepower: 382,
    fuelType: "Premium Gasoline (91+)",
    carfaxReport: {
      ownersCount: 1,
      accidentFree: true,
      serviceRecordsCount: 4,
      lastReportedCity: "Oakville, ON",
      registrationProvince: "Ontario",
      odometerRollbackRisk: false,
    },
    damageHotspots: [],
    sellerNotes:
      "Factory M Performance Exhaust, adaptive M suspension, Shadowline package. Immaculate paint condition, front bumper PPF (Paint Protection Film) installed at delivery.",
  },
  "auc-toyota-rav4-2024": {
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
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80",
    ],
    photosCount: 12,
    auctionEndsAt: new Date(Date.now() + (21 * 60 + 30) * 60 * 1000).toISOString(),
    myCurrentBidCents: null,
    totalBidsPlaced: 11,
    reserveStatus: "RESERVE_PENDING",
    carfaxClean: true,
    keysCount: 2,
    hasLien: false,
    engineSpec: "2.5L 4-Cylinder Hybrid Synergy Drive",
    horsepower: 219,
    fuelType: "Regular Unleaded Hybrid",
    carfaxReport: {
      ownersCount: 1,
      accidentFree: true,
      serviceRecordsCount: 2,
      lastReportedCity: "Montreal, QC",
      registrationProvince: "Quebec",
      odometerRollbackRisk: false,
    },
    damageHotspots: [],
    sellerNotes:
      "Like-new condition. Balance of Toyota factory warranty (3yr/60k comprehensive, 8yr/160k hybrid components). Includes Michelin X-Ice winter tire set.",
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  await simulateLatency(150);

  const { id } = await params;
  const item = INVENTORY_DATABASE[id] || INVENTORY_DATABASE["auc-porsche-macan-2022"];

  if (!item) {
    return fail(404, "NOT_FOUND", "Vehicle auction record not found");
  }

  return ok(item);
}
