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
    <div className="w-full pb-8">
      <DealerSubscriptionView />
    </div>
  );
}
