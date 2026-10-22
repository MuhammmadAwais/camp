import React from "react";
import type { Metadata } from "next";
import { VehicleInspectionView } from "@/components/dealer/VehicleInspectionView";

export const metadata: Metadata = {
  title: "Vehicle Inspection Sheet | AutoNexa Wholesale Exchange",
  description:
    "Institutional wholesale vehicle condition report, multi-angle photo gallery, declared imperfections, and sealed-bid telemetry.",
};

import { getDealerVehicle } from "@/lib/mock/dealer-inventory";

export default async function DealerAuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = getDealerVehicle(id);

  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <VehicleInspectionView initialVehicle={vehicle} />
      </main>
    </div>
  );
}
