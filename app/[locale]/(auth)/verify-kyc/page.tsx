import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { KycGate } from "@/components/auth/KycGate";

export const metadata: Metadata = {
  title: "Verify your identity | AutoNexa",
};

export default async function VerifyKycPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard
      eyebrow={<FunnelSteps current="identity" />}
      title={t("verifyKycTitle")}
      description={t("verifyKycDescription")}
    >
      <KycGate />
    </AuthCard>
  );
}
