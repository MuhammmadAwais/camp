import React from "react";
import type { Metadata } from "next";
import { ListingModerationView } from "@/components/admin/ListingModerationView";

export const metadata: Metadata = {
  title: "Listing Moderation Queue | AutoNexa Administration",
  description:
    "Review and verify pending Canadian consumer vehicle submissions before launching the 24h dealer sealed-bid auction.",
};

export default function AdminModerationPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ListingModerationView />
      </main>
    </div>
  );
}
