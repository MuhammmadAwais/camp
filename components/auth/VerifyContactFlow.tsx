"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Mail, MessageSquareText } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormAlert } from "@/components/auth/FormAlert";
import { MockModeHint } from "@/components/auth/MockModeHint";
import { OtpInput } from "@/components/auth/OtpInput";
import { useApplySession } from "@/hooks/useSession";
import { usePendingVerification, useResendCode, useVerifyContact } from "@/hooks/useAuthMutations";
import { applyFieldErrors, getErrorMessage } from "@/lib/api-errors";
import { getPostAuthRoute } from "@/lib/auth-routing";
import { MOCK_OTP_CODE } from "@/lib/mock/seed";
import { authKeys } from "@/lib/query-keys";
import { otpFormSchema, type OtpFormInput } from "@/lib/schemas/auth-schema";
import type { PendingVerification, VerificationChannel } from "@/lib/types/auth";

interface Props {
  registrationId: string | null;
}

const RESEND_COOLDOWN_SECONDS = 30;

// FR-EU-01 — email then SMS verification; a session is issued once both are confirmed.
export function VerifyContactFlow({ registrationId }: Props) {
  const pending = usePendingVerification(registrationId);

  if (!registrationId) {
    return (
      <FormAlert tone="error">
        This verification link is missing details.{" "}
        <Link href="/login" className="font-semibold underline">
          Sign in
        </Link>{" "}
        to receive a new code.
      </FormAlert>
    );
  }

  if (pending.isPending) {
    return (
      <div className="flex justify-center py-10" role="status" aria-label="Loading">
        <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  if (pending.isError || !pending.data) {
    return (
      <FormAlert tone="error">
        {getErrorMessage(pending.error)}{" "}
        <Link href="/login" className="font-semibold underline">
          Go to sign in
        </Link>
      </FormAlert>
    );
  }

  const channel: VerificationChannel = pending.data.emailVerified ? "phone" : "email";
  // `key` resets the code field and cooldown when moving from email to phone.
  return <OtpStep key={channel} channel={channel} verification={pending.data} />;
}

interface OtpStepProps {
  channel: VerificationChannel;
  verification: PendingVerification;
}

function OtpStep({ channel, verification }: OtpStepProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const applySession = useApplySession();
  const verify = useVerifyContact(channel);
  const resend = useResendCode();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resent, setResent] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<OtpFormInput>({ resolver: zodResolver(otpFormSchema), defaultValues: { code: "" } });

  // UI-only resend countdown (not auction timing, so a local clock is fine here).
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const target = channel === "email" ? verification.emailMasked : verification.phoneMasked;
  const stepNumber = channel === "email" ? 1 : 2;

  const onSubmit = async ({ code }: OtpFormInput) => {
    try {
      const result = await verify.mutateAsync({ registrationId: verification.registrationId, code });
      if (result.session) {
        applySession(result.session);
        queryClient.removeQueries({ queryKey: authKeys.registration(verification.registrationId) });
        router.replace(getPostAuthRoute(result.session.user));
        return;
      }
      queryClient.setQueryData(authKeys.registration(verification.registrationId), result.verification);
    } catch (err) {
      setValue("code", "");
      if (!applyFieldErrors(err, setError, ["code"])) setError("code", { type: "server", message: getErrorMessage(err) });
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      const { retryAfterSeconds } = await resend.mutateAsync({ registrationId: verification.registrationId, channel });
      setCooldown(retryAfterSeconds);
      setResent(true);
    } catch (err) {
      setError("code", { type: "server", message: getErrorMessage(err) });
    }
  };

  const Icon = channel === "email" ? Mail : MessageSquareText;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="flex items-center gap-3 rounded-md border border-border-card bg-surface-container-low p-3.5">
        <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">
            Step {stepNumber} of 2 · {channel === "email" ? "Email" : "Mobile"}
          </p>
          <p className="font-body text-sm text-on-surface truncate">
            Code sent to <span className="font-mono">{target}</span>
          </p>
        </div>
      </div>

      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <OtpInput
            label={`${channel === "email" ? "Email" : "SMS"} verification code`}
            value={field.value}
            onChange={field.onChange}
            onComplete={() => void handleSubmit(onSubmit)()}
            disabled={verify.isPending}
            invalid={Boolean(errors.code)}
            describedBy={errors.code ? "otp-error" : undefined}
            autoFocus
          />
        )}
      />
      {errors.code && (
        <p id="otp-error" role="alert" className="-mt-2 font-body text-xs font-medium text-error">
          {errors.code.message}
        </p>
      )}

      {resent && <FormAlert tone="success">A new code is on its way.</FormAlert>}

      <MockModeHint>
        no {channel === "email" ? "email" : "SMS"} is sent — enter <span className="font-mono font-semibold">{MOCK_OTP_CODE}</span>.
      </MockModeHint>

      <AuthButton type="submit" isLoading={verify.isPending} loadingText="Verifying…">
        {channel === "email" ? "Verify email" : "Verify mobile & continue"}
      </AuthButton>

      <p className="text-center font-body text-xs text-on-surface-variant/80">
        Didn&apos;t get it?{" "}
        {cooldown > 0 ? (
          <span className="font-mono">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resend.isPending}
            className="font-semibold text-primary hover:underline underline-offset-4 cursor-pointer disabled:opacity-50"
          >
            {resend.isPending ? "Sending…" : "Resend code"}
          </button>
        )}
      </p>
    </form>
  );
}
