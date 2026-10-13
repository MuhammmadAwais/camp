import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { isValidVin, sanitizeVinInput } from "@/lib/vin";

export const metadata: Metadata = {
  title: "Create your account | AutoNexa",
};

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const vin = sanitizeVinInput(firstParam(params.vin) ?? "");
  const hasVehicle = isValidVin(vin);

  return (
    <AuthCard
      eyebrow={<FunnelSteps current="account" hasVehicle={hasVehicle} />}
      title="Create your account"
      description=""
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#008C87] hover:underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm initialVin={hasVehicle ? vin : null} initialPostalCode={firstParam(params.postal) ?? ""} />
    </AuthCard>
  );
}
