"use client";

import { useState } from "react";
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
import { PasswordField } from "@/components/auth/PasswordField";
import { useLogin } from "@/hooks/useAuthMutations";
import { useApplySession } from "@/hooks/useSession";
import { applyFieldErrors, getApiFailure, getErrorMessage } from "@/lib/api-errors";
import { getPostAuthRoute } from "@/lib/auth-routing";
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
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  const noticeEntry = notice ? NOTICES[notice] : undefined;
  const failure = getApiFailure(login.error);
  const showBanner = login.isError && failure?.code !== "VERIFICATION_REQUIRED" && !failure?.fieldErrors;

  return (
    <div className="space-y-5">
      {noticeEntry && <FormAlert tone={noticeEntry.tone}>{noticeEntry.text}</FormAlert>}

      <GoogleAuthButton label="Sign in with Google" onClick={() => router.push("/dashboard")} />

      <div className="flex items-center gap-3 my-4" aria-hidden>
        <span className="h-px flex-1 bg-gray-200" />
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSignIn} noValidate className="space-y-4">
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
          <PasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Min. 10 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#8C383E] focus:ring-[#8C383E]"
              />
              <span className="font-body text-xs text-gray-600">Keep me logged in</span>
            </label>
            <Link
              href="/forgot-password"
              className="font-body text-xs font-semibold text-[#8C383E] hover:underline underline-offset-4 transition-colors py-1"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {showBanner && <FormAlert tone="error">{getErrorMessage(login.error)}</FormAlert>}

        <AuthButton type="submit" isLoading={isSubmitting} loadingText="Signing in…">
          Sign in <ArrowRight className="w-4 h-4" aria-hidden />
        </AuthButton>
      </form>
    </div>
  );
}
