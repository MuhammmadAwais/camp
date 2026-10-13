"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { ArrowRight, Mail, MapPin, Phone, User } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { FormAlert } from "@/components/auth/FormAlert";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { useRegister } from "@/hooks/useAuthMutations";
import { applyFieldErrors, getApiFailure, getErrorMessage } from "@/lib/api-errors";
import { PROVINCES, formatPhoneDisplay, normalizePostalCode, suggestProvinceFromPostal } from "@/lib/canada";
import { authKeys } from "@/lib/query-keys";
import {
  registerFormSchema,
  type RegisterFormInput,
  type RegisterFormOutput,
  type RegisterPayload,
} from "@/lib/schemas/auth-schema";
import { useSellIntentStore } from "@/store/useSellIntentStore";

interface Props {
  initialVin: string | null;
  initialPostalCode: string;
}

const PROVINCE_OPTIONS = PROVINCES.map((p) => ({ value: p.code, label: p.name }));

const SERVER_FIELDS = ["firstName", "lastName", "email", "phone", "postalCode", "province", "password"] as const;

// FR-EU-01 — full name, email, mobile, postal code, province; stacked single-row inputs.
export function RegisterForm({ initialVin, initialPostalCode }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();
  const setIntent = useSellIntentStore((s) => s.setIntent);

  // Defaults come from the URL (set by /sell) so server and client render identical markup.
  const vin = initialVin;
  const startPostal = normalizePostalCode(initialPostalCode);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      postalCode: startPostal,
      province: suggestProvinceFromPostal(startPostal) ?? undefined,
      password: "",
      confirmPassword: "",
      isAdult: false,
      acceptTerms: false,
      marketingOptIn: false,
      vin: vin ?? undefined,
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = async (values: RegisterFormOutput) => {
    // confirmPassword is UI-only and never leaves the browser.
    const payload: RegisterPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      postalCode: values.postalCode,
      province: values.province,
      password: values.password,
      acceptTerms: true,
      isAdult: true,
      marketingOptIn: values.marketingOptIn,
      vin: values.vin,
    };
    try {
      const pending = await registerMutation.mutateAsync(payload);
      queryClient.setQueryData(authKeys.registration(pending.registrationId), pending);
      // Keep a VIN captured earlier if the visitor reached /register without one in the URL.
      setIntent({ vin: vin ?? useSellIntentStore.getState().vin, postalCode: values.postalCode });
      router.push(`/verify?rid=${encodeURIComponent(pending.registrationId)}`);
    } catch (err) {
      applyFieldErrors(err, setError, SERVER_FIELDS);
    }
  };

  const failure = getApiFailure(registerMutation.error);
  const showBanner = registerMutation.isError && !failure?.fieldErrors;

  return (
    <div className="space-y-5">
      <GoogleAuthButton label="Sign up with Google" />

      <div className="flex items-center gap-3 my-4" aria-hidden>
        <span className="h-px flex-1 bg-gray-200" />
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-gray-400">or with email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Single-row stacked inputs: NO two inputs in the same row */}
        <AuthField
          label="First name"
          placeholder="e.g. Alex"
          autoComplete="given-name"
          icon={<User className="w-4 h-4" />}
          error={errors.firstName?.message}
          {...register("firstName")}
        />

        <AuthField
          label="Last name"
          placeholder="e.g. Morgan"
          autoComplete="family-name"
          icon={<User className="w-4 h-4" />}
          error={errors.lastName?.message}
          {...register("lastName")}
        />

        <AuthField
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.ca"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthField
          label="Mobile phone number"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="(416) 555-0123"
          icon={<Phone className="w-4 h-4" />}
          hint="We will text a 6-digit verification code. Canadian numbers only."
          error={errors.phone?.message}
          {...register("phone", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = formatPhoneDisplay(e.target.value);
            },
          })}
        />

        <AuthField
          label="Postal code"
          autoComplete="postal-code"
          placeholder="M5V 2T6"
          icon={<MapPin className="w-4 h-4" />}
          className="uppercase tracking-wider"
          error={errors.postalCode?.message}
          {...register("postalCode", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = normalizePostalCode(e.target.value);
              const suggested = suggestProvinceFromPostal(e.target.value);
              if (suggested && !getValues("province")) setValue("province", suggested, { shouldValidate: true });
            },
          })}
        />

        <AuthSelect
          label="Province / territory"
          placeholder="Select province or territory…"
          autoComplete="address-level1"
          options={PROVINCE_OPTIONS}
          error={errors.province?.message}
          {...register("province")}
        />

        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Min. 10 characters"
          hint="At least 10 characters with a letter and a number."
          showStrength
          strengthValue={passwordValue}
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordField
          label="Confirm password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <fieldset className="space-y-3 pt-2">
          <legend className="sr-only">Requirements</legend>
          <AuthCheckbox
            label="I confirm I am 18 or older and the registered owner of the vehicle I plan to sell."
            error={errors.isAdult?.message}
            {...register("isAdult")}
          />
          <AuthCheckbox
            label={
              <>
                I agree to the{" "}
                <Link href="/legal/terms" className="font-semibold text-[#008C87] underline underline-offset-2" target="_blank">
                  Terms
                </Link>{" "}
                and consent to the{" "}
                <Link href="/legal/privacy" className="font-semibold text-[#008C87] underline underline-offset-2" target="_blank">
                  Privacy Policy
                </Link>
                .
              </>
            }
            error={errors.acceptTerms?.message}
            {...register("acceptTerms")}
          />
        </fieldset>

        <fieldset className="rounded-lg border border-gray-200 bg-gray-50/60 p-3.5">
          <legend className="px-1 font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Optional
          </legend>
          <AuthCheckbox
            label="Send me market auction updates and selling tips by email. You can unsubscribe anytime."
            {...register("marketingOptIn")}
          />
        </fieldset>

        {showBanner && (
          <FormAlert tone="error">
            {getErrorMessage(registerMutation.error)}
            {failure?.code === "EMAIL_TAKEN" && (
              <>
                {" "}
                <Link href="/login" className="font-semibold underline">
                  Sign in
                </Link>
              </>
            )}
          </FormAlert>
        )}

        <AuthButton type="submit" isLoading={isSubmitting} loadingText="Creating your account…">
          Create account <ArrowRight className="w-4 h-4" aria-hidden />
        </AuthButton>
      </form>
    </div>
  );
}
