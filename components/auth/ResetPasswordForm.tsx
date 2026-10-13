"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormAlert } from "@/components/auth/FormAlert";
import { PasswordField } from "@/components/auth/PasswordField";
import { useResetPassword } from "@/hooks/useAuthMutations";
import { applyFieldErrors, getApiFailure, getErrorMessage } from "@/lib/api-errors";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "@/lib/schemas/auth-schema";

interface Props {
  token: string | null;
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const passwordValue = useWatch({ control, name: "password" }) ?? "";

  if (!token) {
    return (
      <FormAlert tone="error">
        This reset link is incomplete.{" "}
        <Link href="/forgot-password" className="font-semibold underline">
          Request a new one
        </Link>
        .
      </FormAlert>
    );
  }

  const onSubmit = async ({ password }: ResetPasswordFormInput) => {
    try {
      await reset.mutateAsync({ token, password });
      router.replace("/login?notice=password-reset");
    } catch (err) {
      applyFieldErrors(err, setError, ["password"]);
    }
  };

  const tokenInvalid = getApiFailure(reset.error)?.code === "RESET_TOKEN_INVALID";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <PasswordField
        label="New password"
        autoComplete="new-password"
        hint="At least 10 characters with a letter and a number."
        showStrength
        strengthValue={passwordValue}
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      {reset.isError && !errors.password && (
        <FormAlert tone="error">
          {getErrorMessage(reset.error)}
          {tokenInvalid && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            </>
          )}
        </FormAlert>
      )}
      <AuthButton type="submit" isLoading={isSubmitting} loadingText="Updating password…">
        Update password
      </AuthButton>
    </form>
  );
}
