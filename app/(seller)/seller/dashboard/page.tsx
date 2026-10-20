import type { Metadata } from "next";
import { SellerPortalShell } from "@/components/seller/SellerPortalShell";

export const metadata: Metadata = {
  title: "Seller Dashboard | AutoNexa",
  description: "Live wholesale floor, sealed-bid auction telemetry, and listing management.",
};

export default function SellerDashboardPage() {
  return <SellerPortalShell />;
}
