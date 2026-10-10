import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { isValidVin, sanitizeVinInput } from "@/lib/vin";

export const metadata: Metadata = {
  title: "Create your seller account | AutoNexa",
};

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const vin = sanitizeVinInput(firstParam(params.vin) ?? "");

  return (
    <AuthCard
      eyebrow={<FunnelSteps current="account" />}
      title="Create your seller account"
      description="Free for sellers, always. We verify every account so dealers bid with confidence."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm initialVin={isValidVin(vin) ? vin : null} initialPostalCode={firstParam(params.postal) ?? ""} />
    </AuthCard>
  );
}
