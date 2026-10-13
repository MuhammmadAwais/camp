"use client";

import { RequireSession } from "@/components/auth/RequireSession";
import { SellerDashboard } from "@/components/seller/SellerDashboard";

export function SellerPortalShell() {
  return (
    <RequireSession fallbackClassName="text-portal-text-muted">
      {(user) => (
        <main className="w-full">
          <SellerDashboard user={user} />
        </main>
      )}
    </RequireSession>
  );
}
