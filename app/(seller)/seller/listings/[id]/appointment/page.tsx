import { Metadata } from "next";
import { SellerPortalShell } from "@/components/seller/SellerPortalShell";
import { AppointmentVoucherCard } from "@/components/seller/AppointmentVoucherCard";

export const metadata: Metadata = {
  title: "Dealership Handover Voucher | AutoNexa",
  description: "Official vehicle handover pass, required documents checklist, and directions.",
};

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerPortalShell>
      <AppointmentVoucherCard listingId={id} />
    </SellerPortalShell>
  );
}
