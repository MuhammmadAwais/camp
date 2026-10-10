"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ArrowRight, Hash, MapPin } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { DecodedVehicleCard } from "@/components/auth/DecodedVehicleCard";
import { FormAlert } from "@/components/auth/FormAlert";
import { FunnelSteps } from "@/components/auth/FunnelSteps";
import { useVinDecode } from "@/hooks/useVinDecode";
import { IS_MOCK_API } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/api-errors";
import { normalizePostalCode } from "@/lib/canada";
import { MOCK_DEMO_VINS } from "@/lib/mock/seed";
import {
  vinDecodeFormSchema,
  type VinDecodeFormInput,
  type VinDecodeFormOutput,
} from "@/lib/schemas/vehicle-schema";
import { isValidVin, sanitizeVinInput } from "@/lib/vin";
import { useSellIntentStore } from "@/store/useSellIntentStore";

interface Props {
  initialVin: string;
  initialPostalCode: string;
}

// Funnel step 1 (VIN-first): decode the vehicle before asking for an account.
// Renders its own card because the heading changes once the VIN is decoded.
export function SellStartForm({ initialVin, initialPostalCode }: Props) {
  const router = useRouter();
  const setIntent = useSellIntentStore((s) => s.setIntent);

  const startVin = sanitizeVinInput(initialVin);
  const [decodeVin, setDecodeVin] = useState<string | null>(isValidVin(startVin) ? startVin : null);
  const [postalCode, setPostalCode] = useState(normalizePostalCode(initialPostalCode));

  const decode = useVinDecode(decodeVin);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<VinDecodeFormInput, unknown, VinDecodeFormOutput>({
    resolver: zodResolver(vinDecodeFormSchema),
    defaultValues: { vin: startVin, postalCode: normalizePostalCode(initialPostalCode) },
  });

  const vinLength = sanitizeVinInput(useWatch({ control, name: "vin" }) ?? "").length;

  const onSubmit = (values: VinDecodeFormOutput) => {
    setPostalCode(values.postalCode);
    setDecodeVin(values.vin);
  };

  const continueToAccount = (vin: string | null) => {
    setIntent({ vin, postalCode: postalCode || null });
    const params = new URLSearchParams();
    if (vin) params.set("vin", vin);
    if (postalCode) params.set("postal", postalCode);
    const query = params.toString();
    router.push(query ? `/register?${query}` : "/register");
  };

  const signInFooter = (
    <>
      Already have an account?{" "}
      <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
        Sign in
      </Link>
    </>
  );

  if (decodeVin && decode.data) {
    return (
      <AuthCard
        eyebrow={<FunnelSteps current="vehicle" />}
        title="Review your vehicle details"
        description="Specs retrieved automatically from your VIN for Canadian dealer offers."
        footer={signInFooter}
      >
        <div className="space-y-5">
          <DecodedVehicleCard vehicle={decode.data} onEdit={() => setDecodeVin(null)} />
          <FormAlert tone="info">
            Only verified Canadian dealers bid on AutoNexa, and they bid directly on verified listings — so next we&apos;ll
            set up your free seller account. It takes about three minutes.
          </FormAlert>
          <AuthButton type="button" onClick={() => continueToAccount(decodeVin)}>
            Continue to seller account <ArrowRight className="w-4 h-4" aria-hidden />
          </AuthButton>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow={<FunnelSteps current="vehicle" />}
      title="Let's identify your car"
      description="Your VIN fills in the specs automatically, so dealers see exactly what you're selling."
      footer={signInFooter}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthField
          label="Vehicle Identification Number (VIN)"
          placeholder="e.g. 2HGFE2F58NH512345"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          icon={<Hash className="w-4 h-4" />}
          className="font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-body"
          error={errors.vin?.message}
          hint="Find it on your ownership, insurance slip, or the driver-side dashboard."
          trailing={
            <span className={`pr-2 font-mono text-xs font-semibold ${vinLength === 17 ? "text-success" : "text-outline"}`}>
              {vinLength}/17
            </span>
          }
          {...register("vin", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = sanitizeVinInput(e.target.value);
            },
          })}
        />

        <AuthField
          label="Postal code (optional)"
          placeholder="M5V 2T6"
          autoComplete="postal-code"
          icon={<MapPin className="w-4 h-4" />}
          className="uppercase tracking-wider placeholder:tracking-normal"
          error={errors.postalCode?.message}
          hint="Used to show you dealers within driving distance."
          {...register("postalCode", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = normalizePostalCode(e.target.value);
            },
          })}
        />

        {decode.isError && <FormAlert tone="error">{getErrorMessage(decode.error)}</FormAlert>}

        <AuthButton type="submit" isLoading={decode.isFetching} loadingText="Decoding VIN…">
          Decode my vehicle <ArrowRight className="w-4 h-4" aria-hidden />
        </AuthButton>

        {IS_MOCK_API && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-body text-xs text-on-surface-variant/80">Try a demo VIN:</span>
            {MOCK_DEMO_VINS.map((demo) => (
              <button
                key={demo.vin}
                type="button"
                onClick={() => setValue("vin", demo.vin, { shouldValidate: true })}
                className="rounded-md border border-border-card bg-surface-container-lowest px-2 py-1 font-mono text-[11px] text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {demo.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => continueToAccount(null)}
          className="w-full text-center font-body text-sm font-semibold text-primary hover:text-primary-hover hover:underline underline-offset-4 transition-colors cursor-pointer"
        >
          Don&apos;t have your VIN handy? Create your account first →
        </button>
      </form>
    </AuthCard>
  );
}
