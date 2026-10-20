import React from "react";
import { DealerHeader } from "@/components/dealer/DealerHeader";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text flex flex-col font-body transition-colors">
      <DealerHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
