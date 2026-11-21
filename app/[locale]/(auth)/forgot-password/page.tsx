import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password | AutoNexa",
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard
      title={t("forgotTitle")}
      description={t("forgotDescription")}
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
          {t("backToSignIn")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
