"use client";

import React from "react";
import { RequireSession } from "@/components/auth/RequireSession";
import { SellerDashboard } from "@/components/seller/SellerDashboard";
import type { SessionUser } from "@/lib/types/auth";

interface SellerPortalShellProps {
  children?: React.ReactNode | ((user: SessionUser) => React.ReactNode);
}

export function SellerPortalShell({ children }: SellerPortalShellProps) {
  return (
    <RequireSession fallbackClassName="text-portal-text-muted">
      {(user) => (
        <main className="w-full">
          {children ? (
            typeof children === "function" ? (
              children(user)
            ) : (
              children
            )
          ) : (
            <SellerDashboard user={user} />
          )}
        </main>
      )}
    </RequireSession>
  );
}
