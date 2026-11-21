import React from "react";
import type { Metadata } from "next";
import { DealerRegisterView } from "@/components/dealer/DealerRegisterView";

export const metadata: Metadata = {
  title: "Dealership Registration & Licensing | AutoNexa Wholesale Exchange",
  description:
    "Register your licensed Canadian dealership for exclusive access to consumer wholesale trade-in auctions.",
};

export default function DealerRegisterPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerRegisterView />
      </main>
    </div>
  );
}
