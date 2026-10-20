import React from "react";
import type { Metadata } from "next";
import { DisputeManagementView } from "@/components/admin/DisputeManagementView";

export const metadata: Metadata = {
  title: "Dispute Case Management | AutoNexa Administration",
  description:
    "Arbitrate condition discrepancies and settlement disputes between sellers and dealerships.",
};

export default function AdminDisputesPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DisputeManagementView />
      </main>
    </div>
  );
}
