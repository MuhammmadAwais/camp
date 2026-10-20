import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text antialiased">
      <AdminHeader />
      <div className="w-full">{children}</div>
    </div>
  );
}
