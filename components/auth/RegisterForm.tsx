"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Building, FileText, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";
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

const LICENSING_BODIES = [
  { value: "OMVIC", label: "OMVIC (Ontario)" },
  { value: "AMVIC", label: "AMVIC (Alberta)" },
  { value: "VSA", label: "VSA (British Columbia)" },
  { value: "OTHER", label: "Other Provincial Regulator" },
];

const SERVER_FIELDS = [
  "role",
  "firstName",
  "lastName",
  "email",
  "phone",
  "postalCode",
  "province",
  "password",
  "dealershipName",
  "licenseNumber",
] as const;

export function RegisterForm({ initialVin, initialPostalCode }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();
  const setIntent = useSellIntentStore((s) => s.setIntent);

  const [subStep, setSubStep] = useState<1 | 2>(1);

  const vin = initialVin;
  const startPostal = normalizePostalCode(initialPostalCode);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: "SELLER",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      postalCode: startPostal,
      province: suggestProvinceFromPostal(startPostal) ?? undefined,
      password: "",
      confirmPassword: "",
      dealershipName: "",
      licenseNumber: "",
      licensingBody: "OMVIC",
      isAdult: false,
      acceptTerms: false,
      marketingOptIn: false,
      vin: vin ?? undefined,
    },
  });

  const role = useWatch({ control, name: "role" }) ?? "SELLER";
  const passwordValue = useWatch({ control, name: "password" }) ?? "";

  const handleRoleChange = (newRole: "SELLER" | "DEALER") => {
    setValue("role", newRole, { shouldValidate: true });
    if (newRole === "SELLER") {
      setValue("dealershipName", "");
      setValue("licenseNumber", "");
      setValue("licensingBody", "OMVIC");
    }
  };

  const handleNextSubStep = async () => {
    // Validate Step 1 fields before advancing
    const isValid = await trigger(["firstName", "lastName", "email", "password", "confirmPassword"]);
    if (isValid) {
      setSubStep(2);
    }
  };

  const onSubmit = async (values: RegisterFormOutput) => {
    const payload: RegisterPayload = {
      role: values.role,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      postalCode: values.postalCode,
      province: values.province,
      password: values.password,
      dealershipName: values.role === "DEALER" ? values.dealershipName : undefined,
      licenseNumber: values.role === "DEALER" ? values.licenseNumber : undefined,
      licensingBody: values.role === "DEALER" ? values.licensingBody : undefined,
      acceptTerms: true,
      isAdult: true,
      marketingOptIn: values.marketingOptIn,
      vin: values.role === "SELLER" ? values.vin : undefined,
    };
    try {
      const pending = await registerMutation.mutateAsync(payload);
      queryClient.setQueryData(authKeys.registration(pending.registrationId), pending);
      setIntent({ vin: values.role === "SELLER" ? (vin ?? useSellIntentStore.getState().vin) : null, postalCode: values.postalCode });
      router.push(`/verify?rid=${encodeURIComponent(pending.registrationId)}`);
    } catch (err) {
      applyFieldErrors(err, setError, SERVER_FIELDS);
    }
  };

  const failure = getApiFailure(registerMutation.error);
  const showBanner = registerMutation.isError && !failure?.fieldErrors;

  return (
    <div className="space-y-5">
      {/* Sub-step indicator */}
      <div className="flex items-center justify-between text-xs font-body text-gray-500 pb-2 border-b border-gray-100">
        <span className="font-semibold text-gray-900">
          {subStep === 1
            ? `Step 1 of 2: ${role === "DEALER" ? "Dealer Credentials" : "Account Credentials"}`
            : `Step 2 of 2: ${role === "DEALER" ? "Dealership & Licensing" : "Contact & Location"}`}
        </span>
        <span className="font-mono text-[11px] font-bold text-[#008C87] bg-[#008C87]/10 px-2 py-0.5 rounded-full">
          {subStep} / 2
        </span>
      </div>

      {subStep === 1 && (
        <>
          {/* Role Switcher Pill */}
          <div className="space-y-2">
            <label className="block font-body text-xs font-semibold uppercase tracking-wider text-gray-500">
              Account Type
            </label>
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => handleRoleChange("SELLER")}
                className={`min-h-[44px] py-2 px-3 rounded-md font-body text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center text-center ${
                  role === "SELLER"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/80"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Private Seller
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("DEALER")}
                className={`min-h-[44px] py-2 px-3 rounded-md font-body text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center text-center ${
                  role === "DEALER"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/80"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Licensed Dealer
              </button>
            </div>
          </div>

          <GoogleAuthButton label={`Sign up as ${role === "DEALER" ? "Dealer" : "Seller"} with Google`} />

          <div className="flex items-center gap-3 my-3" aria-hidden>
            <span className="h-px flex-1 bg-gray-200" />
            <span className="font-body text-xs font-semibold uppercase tracking-wider text-gray-400">or with email</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* ===================== SUB-STEP 1: CREDENTIALS ===================== */}
        {subStep === 1 && (
          <>
            {/* First and Last Name in a Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <AuthField
              label={role === "DEALER" ? "Work email address" : "Email address"}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={role === "DEALER" ? "rep@dealership.ca" : "you@example.ca"}
              hint={role === "DEALER" ? "Use your official dealership email address." : undefined}
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
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

            <AuthButton type="button" onClick={handleNextSubStep}>
              Continue to {role === "DEALER" ? "Dealership Details" : "Contact Details"} <ArrowRight className="w-4 h-4" aria-hidden />
            </AuthButton>
          </>
        )}

        {/* ===================== SUB-STEP 2: PROFILE & COMPLIANCE ===================== */}
        {subStep === 2 && (
          <>
            {role === "DEALER" ? (
              <>
                <AuthField
                  label="Dealership legal name"
                  placeholder="e.g. Apex Automotive Group Inc."
                  icon={<Building className="w-4 h-4" />}
                  error={errors.dealershipName?.message}
                  {...register("dealershipName")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AuthSelect
                    label="Regulatory authority"
                    placeholder="Select regulator…"
                    options={LICENSING_BODIES}
                    error={errors.licensingBody?.message}
                    {...register("licensingBody")}
                  />

                  <AuthField
                    label="Dealer license number"
                    placeholder="e.g. OMVIC-8849201"
                    icon={<ShieldCheck className="w-4 h-4" />}
                    error={errors.licenseNumber?.message}
                    {...register("licenseNumber")}
                  />
                </div>

                <AuthField
                  label="Dealership phone number"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  placeholder="(416) 555-0199"
                  icon={<Phone className="w-4 h-4" />}
                  hint="Direct phone line for account verification."
                  error={errors.phone?.message}
                  {...register("phone", {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = formatPhoneDisplay(e.target.value);
                    },
                  })}
                />

                <div className="grid grid-cols-2 gap-3">
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
                    label="Province"
                    placeholder="Select…"
                    autoComplete="address-level1"
                    options={PROVINCE_OPTIONS}
                    error={errors.province?.message}
                    {...register("province")}
                  />
                </div>

                <fieldset className="space-y-3 pt-2">
                  <legend className="sr-only">Dealer Requirements</legend>
                  <AuthCheckbox
                    label="I confirm I am an authorized representative of this licensed automotive dealership."
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
              </>
            ) : (
              <>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    label="Province"
                    placeholder="Select…"
                    autoComplete="address-level1"
                    options={PROVINCE_OPTIONS}
                    error={errors.province?.message}
                    {...register("province")}
                  />
                </div>

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
              </>
            )}

            {/* Clean Optional Marketing Box — No broken legend strikethrough */}
            <div className="rounded-xl border border-gray-200/90 bg-gray-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded">
                  Optional
                </span>
                <span className="font-body text-xs text-gray-400">
                  {role === "DEALER" ? "Dealer market intelligence" : "Market updates"}
                </span>
              </div>
              <AuthCheckbox
                label={
                  role === "DEALER"
                    ? "Send me live wholesale inventory drops and market reports by email."
                    : "Send me market auction updates and selling tips by email."
                }
                {...register("marketingOptIn")}
              />
            </div>

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

            <div className="space-y-2 pt-2">
              <AuthButton type="submit" isLoading={isSubmitting} loadingText="Creating your account…">
                Create {role === "DEALER" ? "Dealer" : "Seller"} Account <ArrowRight className="w-4 h-4" aria-hidden />
              </AuthButton>

              <button
                type="button"
                onClick={() => setSubStep(1)}
                className="w-full min-h-[44px] py-2 font-body text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Credentials</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
