import React from "react";
import type { Metadata } from "next";
import { DealerBillingView } from "@/components/dealer/DealerBillingView";

export const metadata: Metadata = {
  title: "Invoices & Billing | AutoNexa Wholesale Exchange",
  description:
    "Dealership billing portal, invoice history downloads, and monthly bid quota management.",
};

export default function DealerBillingPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerBillingView />
      </main>
    </div>
  );
}
