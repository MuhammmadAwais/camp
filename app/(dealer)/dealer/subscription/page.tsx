import React from "react";
import type { Metadata } from "next";
import { DealerSubscriptionView } from "@/components/dealer/DealerSubscriptionView";

export const metadata: Metadata = {
  title: "Subscription Plans | AutoNexa Wholesale Exchange",
  description:
    "Choose your Canadian dealership wholesale bidding tier. Predictable monthly pricing with zero buyer premiums.",
};

export default function DealerSubscriptionPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerSubscriptionView />
      </main>
    </div>
  );
}
