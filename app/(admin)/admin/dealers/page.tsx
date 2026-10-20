import React from "react";
import type { Metadata } from "next";
import { DealerVerificationView } from "@/components/admin/DealerVerificationView";

export const metadata: Metadata = {
  title: "Dealer Verification Queue | AutoNexa Administration",
  description:
    "Review and verify Canadian dealership licensing applications against OMVIC, AMVIC, VSA, and OPC registries.",
};

export default function AdminDealersPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerVerificationView />
      </main>
    </div>
  );
}
