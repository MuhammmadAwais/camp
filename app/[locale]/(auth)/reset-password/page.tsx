import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Choose a new password | AutoNexa",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <AuthCard title="Choose a new password" description="For your security, this signs you out on every other device.">
      <ResetPasswordForm token={firstParam(params.token)} />
    </AuthCard>
  );
}
