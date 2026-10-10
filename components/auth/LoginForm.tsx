"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowRight, Mail } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthField } from "@/components/auth/AuthField";
import { FormAlert } from "@/components/auth/FormAlert";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { MockModeHint } from "@/components/auth/MockModeHint";
import { PasswordField } from "@/components/auth/PasswordField";
import { useLogin } from "@/hooks/useAuthMutations";
import { useApplySession } from "@/hooks/useSession";
import { applyFieldErrors, getApiFailure, getErrorMessage } from "@/lib/api-errors";
import { getPostAuthRoute } from "@/lib/auth-routing";
import { MOCK_DEMO_SELLER } from "@/lib/mock/seed";
import { authKeys } from "@/lib/query-keys";
import { loginSchema, type LoginInput, type LoginPayload } from "@/lib/schemas/auth-schema";
import type { PendingVerification } from "@/lib/types/auth";

interface Props {
  next: string | null;
  notice: string | null;
}

const NOTICES: Record<string, { tone: "success" | "info"; text: string }> = {
  "password-reset": { tone: "success", text: "Your password has been updated. Sign in with your new password." },
  "session-expired": { tone: "info", text: "Your session expired. Please sign in again." },
};

function isPendingVerification(value: unknown): value is PendingVerification {
  return typeof value === "object" && value !== null && "registrationId" in value;
}

export function LoginForm({ next, notice }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const login = useLogin();
  const applySession = useApplySession();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginPayload) => {
    try {
      const session = await login.mutateAsync(values);
      applySession(session);
      router.replace(getPostAuthRoute(session.user, next));
    } catch (err) {
      const failure = getApiFailure(err);
      // Unverified accounts are sent back to finish email/SMS verification (FR-EU-01).
      if (failure?.code === "VERIFICATION_REQUIRED" && isPendingVerification(failure.details)) {
        queryClient.setQueryData(authKeys.registration(failure.details.registrationId), failure.details);
        router.push(`/verify?rid=${encodeURIComponent(failure.details.registrationId)}`);
        return;
      }
      applyFieldErrors(err, setError, ["email", "password"]);
    }
  };

  const noticeEntry = notice ? NOTICES[notice] : undefined;
  const failure = getApiFailure(login.error);
  const showBanner = login.isError && failure?.code !== "VERIFICATION_REQUIRED" && !failure?.fieldErrors;

  return (
    <div className="space-y-5">
      {noticeEntry && <FormAlert tone={noticeEntry.tone}>{noticeEntry.text}</FormAlert>}

      <GoogleAuthButton label="Continue with Google" />

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border-card" />
        <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">or</span>
        <span className="h-px flex-1 bg-border-card" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.ca"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="space-y-1.5">
          <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="font-body text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        {showBanner && <FormAlert tone="error">{getErrorMessage(login.error)}</FormAlert>}

        <AuthButton type="submit" isLoading={isSubmitting} loadingText="Signing in…">
          Sign in <ArrowRight className="w-4 h-4" aria-hidden />
        </AuthButton>

        <MockModeHint>
          use the seeded demo seller from <span className="font-mono">lib/mock/seed.ts</span>, or register a new account.{" "}
          <button
            type="button"
            className="font-semibold underline cursor-pointer"
            onClick={() => {
              setValue("email", MOCK_DEMO_SELLER.email);
              setValue("password", MOCK_DEMO_SELLER.password);
            }}
          >
            Fill demo account
          </button>
        </MockModeHint>
      </form>
    </div>
  );
}
