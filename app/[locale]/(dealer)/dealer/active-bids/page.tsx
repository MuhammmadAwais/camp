import React from "react";
import type { Metadata } from "next";
import { DealerActiveBidsView } from "@/components/dealer/DealerActiveBidsView";

export const metadata: Metadata = {
  title: "Active Placed Bids | AutoNexa Wholesale Exchange",
  description:
    "Real-time telemetry on open 24h auctions where your dealership holds an active sealed bid. Upward revision and outbid alerts.",
};

export default function DealerActiveBidsPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerActiveBidsView />
      </main>
    </div>
  );
}
