import React from "react";
import type { Metadata } from "next";
import { DealerWonMatchesView } from "@/components/dealer/DealerWonMatchesView";

export const metadata: Metadata = {
  title: "Won Matches & Physical Handover | AutoNexa Wholesale Exchange",
  description:
    "Dealership post-auction unsealed seller appointments, verification QR passes, and offline vehicle inspection outcome logging.",
};

export default function DealerWonMatchesPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerWonMatchesView />
      </main>
    </div>
  );
}
