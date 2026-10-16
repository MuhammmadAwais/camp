import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Sign in | AutoNexa",
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Sign In"
      description="Enter your email and password to access your AutoNexa account."
      footer={
        <>
          Not registered yet?{" "}
          <Link href="/register" className="font-semibold text-[#8C383E] hover:underline underline-offset-4">
            Create an Account
          </Link>
        </>
      }
    >
      <LoginForm next={firstParam(params.next)} notice={firstParam(params.notice)} />
    </AuthCard>
  );
}
