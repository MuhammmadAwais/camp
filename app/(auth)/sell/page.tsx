import type { Metadata } from "next";
import { SellStartForm } from "@/components/auth/SellStartForm";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Get dealer offers for your car | AutoNexa",
  description: "Enter your VIN to start a free 24-hour sealed-bid auction with licensed Canadian dealers.",
};

export default async function SellPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <SellStartForm initialVin={firstParam(params.vin) ?? ""} initialPostalCode={firstParam(params.postal) ?? ""} />;
}
