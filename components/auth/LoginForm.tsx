"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthField } from "@/components/auth/AuthField";
import { FormAlert } from "@/components/auth/FormAlert";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { useLogin } from "@/hooks/useAuthMutations";
import { useVerifyTotp } from "@/hooks/useMfa";
import { useApplySession, useLogout } from "@/hooks/useSession";
import { applyFieldErrors, getApiFailure, getErrorMessage } from "@/lib/api-errors";
import { getPostAuthRoute } from "@/lib/auth-routing";
import { authKeys } from "@/lib/query-keys";
import { loginSchema, type LoginInput, type LoginPayload } from "@/lib/schemas/auth-schema";
import type { AuthSession, PendingVerification } from "@/lib/types/auth";

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
  const verifyTotp = useVerifyTotp();
  const applySession = useApplySession();
  const logout = useLogout();
  const [rememberMe, setRememberMe] = useState(true);
  const [pendingMfaSession, setPendingMfaSession] =
    useState<AuthSession | null>(null);
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const finalizeLoginSuccess = (session: AuthSession) => {
    applySession(session);

    // Sync with localStorage authService so client components like Header/Sidebar know the user immediately
    if (typeof window !== "undefined") {
      const storedUser = {
        id: session.user.id,
        email: session.user.email,
        name: `${session.user.firstName} ${session.user.lastName}`.trim(),
        phone: session.user.phoneMasked,
        postalCode: session.user.postalCode,
        province: session.user.province,
        role: session.user.role,
        kycStatus: session.user.kycStatus,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("autonexa_active_user", JSON.stringify(storedUser));
    }

    const targetLocale = session.user.languagePref ?? "en";

    if (session.mfaEnrollmentRequired) {
      router.push("/settings/security?mfa=enroll", { locale: targetLocale });
      return;
    }

    const destination = getPostAuthRoute(session.user, next);
    router.push(destination, { locale: targetLocale });
  };

  const onSubmit = async (values: LoginPayload) => {
    try {
      const result = await login.mutateAsync({
        email: values.email,
        password: values.password,
      });

      if (isPendingVerification(result)) {
        router.push(`/verify?rid=${encodeURIComponent(result.registrationId)}`);
        return;
      }

      if (result.mfaRequired && result.mfaFactors && result.mfaFactors.length > 0) {
        setPendingMfaSession(result);
        setSelectedFactorId(result.mfaFactors[0].id);
        setTotpCode("");
        setMfaError(null);
        return;
      }

      finalizeLoginSuccess(result);
    } catch (err) {
      const errFailure = getApiFailure(err);
      if (
        errFailure?.code === "VERIFICATION_REQUIRED" &&
        isPendingVerification(errFailure.details)
      ) {
        queryClient.setQueryData(
          authKeys.registration(errFailure.details.registrationId),
          errFailure.details
        );
        router.push(
          `/verify?rid=${encodeURIComponent(errFailure.details.registrationId)}`
        );
        return;
      }
      applyFieldErrors(err, setError, ["email", "password"]);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMfaSession || !selectedFactorId) return;
    setMfaError(null);

    try {
      const verified = await verifyTotp.mutateAsync({
        factorId: selectedFactorId,
        code: totpCode.replace(/\D/g, ""),
      });
      finalizeLoginSuccess(verified.session);
    } catch (err) {
      setMfaError(getErrorMessage(err));
    }
  };

  if (pendingMfaSession) {
    const factors = pendingMfaSession.mfaFactors ?? [];
    return (
      <form onSubmit={handleTotpSubmit} noValidate className="space-y-4">
        <FormAlert tone="info">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Two-Factor Authentication is enabled on{" "}
              <strong>{pendingMfaSession.user.email}</strong>. Enter the 6-digit
              code from your authenticator app to finish signing in.
            </span>
          </div>
        </FormAlert>

        {factors.length > 1 && (
          <div className="space-y-1">
            <label className="block font-body text-xs font-semibold text-gray-700">
              Authenticator Factor
            </label>
            <select
              value={selectedFactorId}
              onChange={(e) => setSelectedFactorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-900 font-semibold"
            >
              {factors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.friendlyName}
                </option>
              ))}
            </select>
          </div>
        )}

        <AuthField
          label="6-Digit Authenticator Code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
        />

        {mfaError && <FormAlert tone="error">{mfaError}</FormAlert>}

        <AuthButton
          type="submit"
          isLoading={verifyTotp.isPending}
          loadingText="Verifying TOTP…"
          disabled={totpCode.length !== 6}
        >
          Verify &amp; Sign In <ArrowRight className="w-4 h-4" aria-hidden />
        </AuthButton>

        <button
          type="button"
          onClick={() => {
            setPendingMfaSession(null);
            setTotpCode("");
            setMfaError(null);
            logout.mutate();
          }}
          className="w-full py-2 font-body text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          Cancel &amp; switch account
        </button>
      </form>
    );
  }

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
