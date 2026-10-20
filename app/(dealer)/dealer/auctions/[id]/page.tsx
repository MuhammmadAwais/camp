import React from "react";
import type { Metadata } from "next";
import { VehicleInspectionView } from "@/components/dealer/VehicleInspectionView";

export const metadata: Metadata = {
  title: "Vehicle Inspection Sheet | AutoNexa Wholesale Exchange",
  description:
    "Institutional wholesale vehicle condition report, multi-angle photo gallery, declared imperfections, and sealed-bid telemetry.",
};

export default async function DealerAuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch auction item inspection details from API or internal mock
  const fallbackVehicle = {
    id,
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
    damageGrade: "A" as const,
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
    reserveStatus: "RESERVE_MET" as const,
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
        severity: "MINOR" as const,
        description:
          "Small 2cm cosmetic scuff on lower grey diffuser plastic. Surface only, no structural fracture.",
        imageUrl:
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
      },
    ],
    sellerNotes:
      "Single-owner executive lease return. Garaged indoors year-round in downtown Toronto. Full Porsche Centre Oakville service history records available in glovebox. Both OEM fobs and summer Michelin Pilot Sport 4S tires included.",
  };

  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <VehicleInspectionView initialVehicle={fallbackVehicle} />
      </main>
    </div>
  );
}
