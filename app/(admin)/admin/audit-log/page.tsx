import React from "react";
import type { Metadata } from "next";
import { AdminAuditLogView } from "@/components/admin/AdminAuditLogView";

export const metadata: Metadata = {
  title: "Immutable Audit Trail | AutoNexa Administration",
  description:
    "Cryptographically hashed non-repudiation audit ledger recording all administrative marketplace operations.",
};

export default function AdminAuditLogPage() {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminAuditLogView />
      </main>
    </div>
  );
}
