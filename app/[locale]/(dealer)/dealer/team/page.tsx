import React from "react";
import type { Metadata } from "next";
import { DealerTeamView } from "@/components/dealer/DealerTeamView";

export const metadata: Metadata = {
  title: "Team Management | AutoNexa Wholesale Exchange",
  description:
    "Manage authorized dealership buyers, inspectors, and administrators with role-based permissions.",
};

export default function DealerTeamPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DealerTeamView />
      </main>
    </div>
  );
}
