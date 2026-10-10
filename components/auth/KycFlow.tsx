"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, IdCard, Loader2, Lock, ScanFace, ShieldCheck } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { FormAlert } from "@/components/auth/FormAlert";
import { MockModeHint } from "@/components/auth/MockModeHint";
import { PhotoCapture, validateKycPhoto } from "@/components/auth/PhotoCapture";
import { useKycStatus, useSubmitKyc } from "@/hooks/useKyc";
import { getApiFailure, getErrorMessage } from "@/lib/api-errors";
import type { IdDocumentType, SessionUser } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

interface Props {
  user: SessionUser;
}

type Step = "consent" | "document" | "selfie" | "review";

type PhotoKey = "idFront" | "idBack" | "selfie";

const DOC_OPTIONS: ReadonlyArray<{ value: IdDocumentType; label: string; detail: string }> = [
  { value: "DRIVERS_LICENCE", label: "Driver's licence", detail: "Front and back" },
  { value: "PASSPORT", label: "Passport", detail: "Photo page only" },
];

// FR-EU-02 — government photo ID + selfie, required before the first listing (BR-01).
export function KycFlow({ user }: Props) {
  const status = useKycStatus();

  if (status.isPending) {
    return (
      <div className="flex justify-center py-10" role="status" aria-label="Loading verification status">
        <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  if (status.isError) return <FormAlert tone="error">{getErrorMessage(status.error)}</FormAlert>;

  if (status.data.status === "VERIFIED") return <KycVerified firstName={user.firstName} />;
  if (status.data.status === "PENDING") return <KycPending />;

  return <KycCapture rejectReason={status.data.status === "REJECTED" ? status.data.rejectReason : null} expired={status.data.status === "EXPIRED"} />;
}

function KycVerified({ firstName }: { firstName: string }) {
  const router = useRouter();
  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto w-14 h-14 rounded-full bg-success/10 text-success ring-1 ring-success/30 flex items-center justify-center">
        <BadgeCheck className="w-7 h-7" aria-hidden />
      </span>
      <div>
        <p className="font-headline text-xl font-bold text-on-surface">You&apos;re verified, {firstName}</p>
        <p className="mt-1.5 font-body text-sm text-on-surface-variant">
          Your identity is confirmed. You can now list your vehicle for licensed dealers to bid on.
        </p>
      </div>
      <AuthButton type="button" onClick={() => router.push("/dashboard")}>
        Go to my dashboard <ArrowRight className="w-4 h-4" aria-hidden />
      </AuthButton>
    </div>
  );
}

function KycPending() {
  const router = useRouter();
  return (
    <div className="space-y-5 text-center" aria-live="polite">
      <span className="mx-auto w-14 h-14 rounded-full bg-surface-container text-on-surface flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin" aria-hidden />
      </span>
      <div>
        <p className="font-headline text-xl font-bold text-on-surface">Checking your ID…</p>
        <p className="mt-1.5 font-body text-sm text-on-surface-variant">
          This usually takes under a minute. You can leave this page — we&apos;ll email you when it&apos;s done.
        </p>
      </div>
      <AuthButton type="button" variant="secondary" onClick={() => router.push("/dashboard")}>
        Continue to dashboard
      </AuthButton>
    </div>
  );
}

interface CaptureProps {
  rejectReason: string | null;
  expired: boolean;
}

function KycCapture({ rejectReason, expired }: CaptureProps) {
  const submit = useSubmitKyc();
  const [step, setStep] = useState<Step>("consent");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [docType, setDocType] = useState<IdDocumentType>("DRIVERS_LICENCE");
  const [photos, setPhotos] = useState<Record<PhotoKey, File | null>>({ idFront: null, idBack: null, selfie: null });
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoKey, string>>>({});

  const needsBack = docType === "DRIVERS_LICENCE";

  const setPhoto = (key: PhotoKey, file: File | null) => {
    const error = file ? validateKycPhoto(file) : null;
    setPhotos((p) => ({ ...p, [key]: error ? null : file }));
    setPhotoErrors((e) => ({ ...e, [key]: error ?? undefined }));
  };

  const requirePhotos = (keys: PhotoKey[]): boolean => {
    const missing: Partial<Record<PhotoKey, string>> = {};
    for (const key of keys) if (!photos[key]) missing[key] = "Add this photo to continue";
    setPhotoErrors((e) => ({ ...e, ...missing }));
    return Object.keys(missing).length === 0;
  };

  const goFromConsent = () => {
    if (!consent) {
      setConsentError("Your consent is required to verify your identity");
      return;
    }
    setStep("document");
  };

  const goFromDocument = () => {
    if (requirePhotos(needsBack ? ["idFront", "idBack"] : ["idFront"])) setStep("selfie");
  };

  const goFromSelfie = () => {
    if (requirePhotos(["selfie"])) setStep("review");
  };

  const handleSubmit = () => {
    if (!photos.idFront || !photos.selfie) return;
    submit.mutate(
      { idDocType: docType, idFront: photos.idFront, idBack: needsBack ? photos.idBack : null, selfie: photos.selfie },
      {
        onError: (err) => {
          const fields = getApiFailure(err)?.fieldErrors;
          if (!fields) return;
          setPhotoErrors({ idFront: fields.idFront, idBack: fields.idBack, selfie: fields.selfie });
          setStep(fields.idFront || fields.idBack ? "document" : fields.selfie ? "selfie" : "review");
        },
      }
    );
  };

  const stepIndex = ["consent", "document", "selfie", "review"].indexOf(step);

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= stepIndex ? "bg-primary" : "bg-border-card")} />
        ))}
      </div>

      {(rejectReason || expired) && step === "consent" && (
        <FormAlert tone="error">
          {expired
            ? "Your previous verification has expired. Please verify again."
            : `We couldn't verify your last submission: ${rejectReason}. Please try again with clearer photos.`}
        </FormAlert>
      )}

      {step === "consent" && (
        <div className="space-y-5">
          <ul className="space-y-3">
            {[
              { icon: IdCard, title: "Photo of your government ID", text: "Driver's licence or passport, issued in Canada or abroad." },
              { icon: ScanFace, title: "A quick selfie", text: "Matched against your ID photo to confirm it's really you." },
              { icon: Lock, title: "Your images stay with our verification partner", text: "AutoNexa keeps only the result — never copies of your ID." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <div>
                  <p className="font-body text-sm font-semibold text-on-surface">{title}</p>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <AuthCheckbox
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setConsentError(null);
            }}
            error={consentError ?? undefined}
            label="I consent to AutoNexa and its identity verification provider collecting my ID and selfie to verify my identity, as described in the Privacy Policy. This consent can be withdrawn by contacting our privacy officer."
          />
          <AuthButton type="button" onClick={goFromConsent}>
            Start verification <ArrowRight className="w-4 h-4" aria-hidden />
          </AuthButton>
        </div>
      )}

      {step === "document" && (
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 font-body text-sm font-semibold text-on-surface">ID type</legend>
            <div className="grid grid-cols-2 gap-2">
              {DOC_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-md border p-3 transition-colors focus-within:ring-2 focus-within:ring-primary/40",
                    docType === option.value ? "border-primary bg-primary/10" : "border-border-card bg-surface-container-low hover:bg-surface-container"
                  )}
                >
                  <input
                    type="radio"
                    name="idDocType"
                    value={option.value}
                    checked={docType === option.value}
                    onChange={() => setDocType(option.value)}
                    className="sr-only"
                  />
                  <span className="block font-body text-sm font-semibold text-on-surface">{option.label}</span>
                  <span className="block font-body text-xs text-on-surface-variant/80">{option.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={cn("grid gap-3", needsBack && "sm:grid-cols-2")}>
            <PhotoCapture
              label={needsBack ? "Front of licence" : "Passport photo page"}
              instruction="Place on a dark surface, all four corners visible, no glare"
              file={photos.idFront}
              onChange={(f) => setPhoto("idFront", f)}
              error={photoErrors.idFront}
            />
            {needsBack && (
              <PhotoCapture
                label="Back of licence"
                instruction="Make sure the barcode is sharp and readable"
                file={photos.idBack}
                onChange={(f) => setPhoto("idBack", f)}
                error={photoErrors.idBack}
              />
            )}
          </div>

          <StepNav onBack={() => setStep("consent")} onNext={goFromDocument} />
        </div>
      )}

      {step === "selfie" && (
        <div className="space-y-4">
          <PhotoCapture
            label="Selfie"
            instruction="Face the camera in good light. Remove glasses and hats."
            file={photos.selfie}
            onChange={(f) => setPhoto("selfie", f)}
            error={photoErrors.selfie}
            capture="user"
            aspect="portrait"
          />
          <MockModeHint>any photo works. The real provider SDK runs an interactive liveness check here.</MockModeHint>
          <StepNav onBack={() => setStep("document")} onNext={goFromSelfie} />
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <dl className="divide-y divide-border-card rounded-md border border-border-card bg-surface-container-low">
            {[
              { label: "ID type", value: DOC_OPTIONS.find((d) => d.value === docType)?.label ?? "" },
              { label: "ID photos", value: needsBack ? "Front and back added" : "Photo page added" },
              { label: "Selfie", value: "Added" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <dt className="font-body text-xs text-on-surface-variant/80">{row.label}</dt>
                <dd className="font-body text-sm font-semibold text-on-surface">{row.value}</dd>
              </div>
            ))}
          </dl>

          <FormAlert tone="info">
            <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden /> Encrypted upload
            </span>{" "}
            — sent directly for verification over TLS and never shown to dealers.
          </FormAlert>

          {submit.isError && !getApiFailure(submit.error)?.fieldErrors && (
            <FormAlert tone="error">{getErrorMessage(submit.error)}</FormAlert>
          )}

          <AuthButton type="button" onClick={handleSubmit} isLoading={submit.isPending} loadingText="Submitting securely…">
            Submit for verification
          </AuthButton>
          <button
            type="button"
            onClick={() => setStep("selfie")}
            disabled={submit.isPending}
            className="w-full inline-flex items-center justify-center gap-1.5 font-body text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Back
          </button>
        </div>
      )}
    </div>
  );
}

function StepNav({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <AuthButton type="button" variant="secondary" onClick={onBack} className="px-4" aria-label="Back">
        <ArrowLeft className="w-4 h-4" aria-hidden />
      </AuthButton>
      <AuthButton type="button" onClick={onNext}>
        Continue <ArrowRight className="w-4 h-4" aria-hidden />
      </AuthButton>
    </div>
  );
}
