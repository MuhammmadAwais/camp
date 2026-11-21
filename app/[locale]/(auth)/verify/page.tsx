import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { VerifyContactFlow } from "@/components/auth/VerifyContactFlow";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Verify your email and mobile | AutoNexa",
};

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("auth"),
  ]);
  return (
    <AuthCard
      eyebrow={<FunnelSteps current="verify" />}
      title={t("verifyTitle")}
      description={t("verifyDescription")}
    >
      <VerifyContactFlow registrationId={firstParam(params.rid)} />
    </AuthCard>
  );
}
