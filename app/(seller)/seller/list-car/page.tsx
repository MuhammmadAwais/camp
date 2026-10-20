import type { Metadata } from "next";
import { SellerListCarShell } from "@/components/seller/wizard/SellerListCarShell";

export const metadata: Metadata = {
  title: "List Your Vehicle | 24h Wholesale Auction | AutoNexa",
  description:
    "Decode your VIN, map vehicle condition, and launch a 24-hour sealed-bid auction across certified Canadian dealerships.",
};

export default function SellerListCarPage() {
  return <SellerListCarShell />;
}
