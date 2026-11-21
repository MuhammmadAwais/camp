import { Metadata } from "next";
import { SellerPortalShell } from "@/components/seller/SellerPortalShell";
import { DealerSelectionView } from "@/components/seller/DealerSelectionView";

export const metadata: Metadata = {
  title: "Select Winning Dealership | AutoNexa",
  description: "Review unsealed certified dealer bids and accept your winning offer.",
};

export default async function SelectDealerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerPortalShell>
      <DealerSelectionView listingId={id} />
    </SellerPortalShell>
  );
}