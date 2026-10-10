"use client";

import { RequireSession } from "@/components/auth/RequireSession";
import { SellerDashboard } from "@/components/seller/SellerDashboard";
import { SellerHeader } from "@/components/seller/SellerHeader";

export function SellerPortalShell() {
  return (
    <RequireSession fallbackClassName="text-portal-text-muted">
      {(user) => (
        <>
          <SellerHeader user={user} />
          <main>
            <SellerDashboard user={user} />
          </main>
        </>
      )}
    </RequireSession>
  );
}
