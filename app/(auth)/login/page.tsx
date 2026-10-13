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
      title="Welcome back"
      description="Sign in to track your auction, review dealer offers and manage your listing."
      footer={
        <>
          New to AutoNexa?{" "}
          <Link href="/sell" className="font-semibold text-primary hover:underline underline-offset-4">
            Get dealer offers
          </Link>
        </>
      }
    >
      <LoginForm next={firstParam(params.next)} notice={firstParam(params.notice)} />
    </AuthCard>
  );
}
