import React from "react";
import type { Metadata } from "next";
import { DisputeDetailView } from "@/components/admin/DisputeDetailView";

export const metadata: Metadata = {
  title: "Incident Dispute Arbitration Dossier | AutoNexa Administration",
  description:
    "Arbitrate post-inspection condition discrepancies, review technician hoist photo evidence, and execute binding escrow disbursements.",
};

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DisputeDetailView id={id} />
      </main>
    </div>
  );
}
