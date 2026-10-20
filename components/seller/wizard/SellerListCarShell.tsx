"use client";

import React from "react";
import { RequireSession } from "@/components/auth/RequireSession";
import { ListingWizard } from "@/components/seller/wizard/ListingWizard";

export function SellerListCarShell() {
  return (
    <RequireSession fallbackClassName="text-portal-text-muted">
      {() => <ListingWizard />}
    </RequireSession>
  );
}
