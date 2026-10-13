import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { KycGate } from "@/components/auth/KycGate";

export const metadata: Metadata = {
  title: "Verify your identity | AutoNexa",
};

export default function VerifyKycPage() {
  return (
    <AuthCard
      eyebrow={<FunnelSteps current="identity" />}
      title="Verify your identity"
      description="We confirm every seller is who they say they are before dealers can bid. It takes about two minutes."
    >
      <KycGate />
    </AuthCard>
  );
}
