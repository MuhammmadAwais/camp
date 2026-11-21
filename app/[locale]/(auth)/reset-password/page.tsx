import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Choose a new password | AutoNexa",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("auth"),
  ]);
  return (
    <AuthCard title={t("resetTitle")} description={t("resetDescription")}>
      <ResetPasswordForm token={firstParam(params.token)} />
    </AuthCard>
  );
}
