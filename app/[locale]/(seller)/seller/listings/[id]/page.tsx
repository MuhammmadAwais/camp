import { Metadata } from "next";
import { SellerPortalShell } from "@/components/seller/SellerPortalShell";
import { SellerActiveAuctionView } from "@/components/seller/SellerActiveAuctionView";

export const metadata: Metadata = {
  title: "Live Auction Telemetry | AutoNexa",
  description: "Real-time 24-hour sealed wholesale auction countdown and dealer bid activity.",
};

export default async function SellerListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerPortalShell>
      <SellerActiveAuctionView listingId={id} />
    </SellerPortalShell>
  );
}
