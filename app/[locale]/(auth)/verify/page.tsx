import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { VerifyContactFlow } from "@/components/auth/VerifyContactFlow";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Verify your email and mobile | AutoNexa",
};

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <AuthCard
      eyebrow={<FunnelSteps current="verify" />}
      title="Confirm it's you"
      description="We sent 6-digit codes to your email and mobile. Both are required before you can sign in."
    >
      <VerifyContactFlow registrationId={firstParam(params.rid)} />
    </AuthCard>
  );
}
