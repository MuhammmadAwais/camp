import type { NextRequest } from "next/server";
import { fail, mockApiDisabled, ok, requireUser, simulateLatency } from "@/lib/mock/http";
import type { IdDocumentType, KycStatusResponse } from "@/lib/types/auth";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function checkImage(value: FormDataEntryValue | null, label: string): string | null {
  if (!(value instanceof File) || value.size === 0) return `${label} is required`;
  if (!ACCEPTED_TYPES.includes(value.type)) return `${label} must be a JPG, PNG, WEBP or HEIC photo`;
  if (value.size > MAX_IMAGE_BYTES) return `${label} must be 10 MB or smaller`;
  return null;
}

// FR-EU-02 — the real backend forwards these images to the KYC provider (Persona / Onfido / Trulioo)
// and stores only status + provider reference. The mock validates them and discards the bytes.
export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const user = requireUser(request);
  if (user instanceof Response) return user;
  await simulateLatency(900);

  if (user.kyc.status === "VERIFIED") return fail(409, "KYC_ALREADY_VERIFIED", "Your identity is already verified.");
  if (user.kyc.status === "PENDING") return fail(409, "KYC_PENDING", "Your verification is already being reviewed.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "INVALID_FORM", "Upload could not be read. Please try again.");
  }

  const docType = form.get("idDocType");
  if (docType !== "DRIVERS_LICENCE" && docType !== "PASSPORT") {
    return fail(422, "VALIDATION_FAILED", "Select an ID type", { idDocType: "Select an ID type" });
  }
  if (form.get("consent") !== "true") {
    return fail(422, "VALIDATION_FAILED", "Consent is required", { consent: "Consent is required to verify your identity" });
  }

  const fields: Record<string, string> = {};
  const frontError = checkImage(form.get("idFront"), "Front of ID");
  if (frontError) fields.idFront = frontError;
  if (docType === "DRIVERS_LICENCE") {
    const backError = checkImage(form.get("idBack"), "Back of licence");
    if (backError) fields.idBack = backError;
  }
  const selfieError = checkImage(form.get("selfie"), "Selfie");
  if (selfieError) fields.selfie = selfieError;
  if (Object.keys(fields).length > 0) return fail(422, "VALIDATION_FAILED", "Some photos need attention", fields);

  user.kyc = {
    status: "PENDING",
    idDocType: docType satisfies IdDocumentType,
    submittedAt: Date.now(),
    rejectReason: null,
  };

  const body: KycStatusResponse = {
    status: "PENDING",
    rejectReason: null,
    submittedAt: new Date(user.kyc.submittedAt ?? Date.now()).toISOString(),
  };
  return ok(body, 202);
}
