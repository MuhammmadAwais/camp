import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-portal-canvas text-portal-text antialiased">
      <div className="w-full">{children}</div>
    </div>
  );
}
