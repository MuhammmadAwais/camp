"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthField } from "@/components/auth/AuthField";
import { FormAlert } from "@/components/auth/FormAlert";
import { MockModeHint } from "@/components/auth/MockModeHint";
import { useForgotPassword } from "@/hooks/useAuthMutations";
import { applyFieldErrors, getErrorMessage } from "@/lib/api-errors";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth-schema";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput, unknown, { email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: { email: string }) => {
    try {
      await forgot.mutateAsync(values);
    } catch (err) {
      applyFieldErrors(err, setError, ["email"]);
    }
  };

  if (forgot.isSuccess) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success">
          If an account exists for <strong className="font-semibold">{getValues("email")}</strong>, we&apos;ve emailed a link to
          reset your password. It expires in 30 minutes.
        </FormAlert>
        {forgot.data.devResetPath && (
          <MockModeHint>
            no email is sent.{" "}
            <Link href={forgot.data.devResetPath} className="font-semibold underline">
              Open the reset link
            </Link>
          </MockModeHint>
        )}
        <Link href="/login" className="block text-center font-body text-sm font-semibold text-primary hover:underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
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
      {forgot.isError && !errors.email && <FormAlert tone="error">{getErrorMessage(forgot.error)}</FormAlert>}
      <AuthButton type="submit" isLoading={isSubmitting} loadingText="Sending link…">
        Send reset link
      </AuthButton>
    </form>
  );
}
