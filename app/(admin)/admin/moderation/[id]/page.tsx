import React from "react";
import type { Metadata } from "next";
import { ListingModerationDetailView } from "@/components/admin/ListingModerationDetailView";

export const metadata: Metadata = {
  title: "Vehicle Moderation Dossier | AutoNexa Administration",
  description:
    "Review vehicle condition evidence, odometer clarity, and ownership disclosures before starting 24h auction.",
};

export default async function AdminModerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ListingModerationDetailView id={id} />
      </main>
    </div>
  );
}
