import { Metadata } from "next";
import { DealerInventoryFeed } from "@/components/dealer/DealerInventoryFeed";

export const metadata: Metadata = {
  title: "Wholesale Trading Floor | AutoNexa Dealer Exchange",
  description:
    "Participate in live 24-hour sealed-bid wholesale dealer auctions from verified private Canadian vehicle sellers.",
};

export default function DealerInventoryPage() {
  return <DealerInventoryFeed />;
}
