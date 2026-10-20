import React from "react";
import type { Metadata } from "next";
import { AdminAuctionsView } from "@/components/admin/AdminAuctionsView";

export const metadata: Metadata = {
  title: "Auction Master Operations & Overrides | AutoNexa Administration",
  description:
    "Real-time emergency controls, 24h countdown clock extensions, and sealed-bid market surveillance.",
};

export default function AdminAuctionsPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminAuctionsView />
      </main>
    </div>
  );
}
