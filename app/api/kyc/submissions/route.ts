import type { NextRequest } from "next/server";
import type { KycDocumentFile } from "@/lib/server/adapters/kyc.adapter";
import { requireAuth } from "@/lib/server/auth";
import { BadRequestError, ValidationError } from "@/lib/server/errors";
import { handleApiRoute, ok } from "@/lib/server/http";
import {
  assertKycCanSubmit,
  submitKycVerification,
} from "@/lib/server/services/kyc.service";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function checkImage(
  value: FormDataEntryValue | null,
  label: string
): { file: File | null; error: string | null } {
  if (!(value instanceof File) || value.size === 0) {
    return { file: null, error: `${label} is required` };
  }
  if (!ACCEPTED_TYPES.has(value.type.toLowerCase())) {
    return {
      file: null,
      error: `${label} must be a JPG, PNG, WEBP or HEIC photo`,
    };
  }
  if (value.size > MAX_IMAGE_BYTES) {
    return { file: null, error: `${label} must be 10 MB or smaller` };
  }
  return { file: value, error: null };
}

async function toKycFile(file: File): Promise<KycDocumentFile> {
  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    mimeType: file.type.toLowerCase(),
    fileName: file.name,
    sizeBytes: file.size,
  };
}

export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireAuth();
  assertKycCanSubmit(ctx);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new BadRequestError(
      "Upload could not be read. Please try again.",
      "INVALID_FORM"
    );
  }

  const docType = form.get("idDocType");
  if (docType !== "DRIVERS_LICENCE" && docType !== "PASSPORT") {
    throw new ValidationError("Select an ID type", {
      idDocType: "Select an ID type",
    });
  }

  if (form.get("consent") !== "true") {
    throw new ValidationError("Consent is required", {
      consent: "Consent is required to verify your identity",
    });
  }

  const fields: Record<string, string> = {};
  const frontCheck = checkImage(form.get("idFront"), "Front of ID");
  if (frontCheck.error) fields.idFront = frontCheck.error;

  let backFile: File | null = null;
  if (docType === "DRIVERS_LICENCE") {
    const backCheck = checkImage(form.get("idBack"), "Back of licence");
    if (backCheck.error) fields.idBack = backCheck.error;
    backFile = backCheck.file;
  }

  const selfieCheck = checkImage(form.get("selfie"), "Selfie");
  if (selfieCheck.error) fields.selfie = selfieCheck.error;

  if (
    Object.keys(fields).length > 0 ||
    !frontCheck.file ||
    !selfieCheck.file
  ) {
    throw new ValidationError("Some photos need attention", fields);
  }

  const [idFront, idBack, selfie] = await Promise.all([
    toKycFile(frontCheck.file),
    backFile ? toKycFile(backFile) : Promise.resolve(null),
    toKycFile(selfieCheck.file),
  ]);

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const result = await submitKycVerification(
    ctx,
    { idDocType: docType, idFront, idBack, selfie },
    { ipAddress, userAgent }
  );

  return ok(result, 202);
});
