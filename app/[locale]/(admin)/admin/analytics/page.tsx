import React from "react";
import type { Metadata } from "next";
import { AdminAnalyticsView } from "@/components/admin/AdminAnalyticsView";

export const metadata: Metadata = {
  title: "Platform Analytics & Provincial Volume | AutoNexa Administration",
  description:
    "Real-time Gross Merchandise Value (GMV), provincial regulatory distribution, and consumer surplus metrics.",
};

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminAnalyticsView />
      </main>
    </div>
  );
}
