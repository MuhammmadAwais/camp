import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { isValidVin, sanitizeVinInput } from "@/lib/vin";

export const metadata: Metadata = {
  title: "Create your account | AutoNexa",
};

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("auth"),
  ]);
  const vin = sanitizeVinInput(firstParam(params.vin) ?? "");
  const hasVehicle = isValidVin(vin);

  return (
    <AuthCard
      eyebrow={<FunnelSteps current="account" hasVehicle={hasVehicle} />}
      title={t("registerTitle")}
      description={t("registerDescription")}
      footer={
        <>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
            {t("signInLink")}
          </Link>
        </>
      }
    >
      <RegisterForm initialVin={hasVehicle ? vin : null} initialPostalCode={firstParam(params.postal) ?? ""} />
    </AuthCard>
  );
}
