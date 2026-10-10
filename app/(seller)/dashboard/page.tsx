import type { Metadata } from "next";
import { SellerPortalShell } from "@/components/seller/SellerPortalShell";

export const metadata: Metadata = {
  title: "Seller dashboard | AutoNexa",
};

export default function DashboardPage() {
  return <SellerPortalShell />;
}
