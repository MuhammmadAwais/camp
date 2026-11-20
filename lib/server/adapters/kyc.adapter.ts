import { randomUUID } from "node:crypto";
import { getStorageAdapter } from "@/lib/server/adapters/storage.adapter";
import { getServerEnv } from "@/lib/server/env";
import { BadRequestError, ExternalServiceError } from "@/lib/server/errors";
import type { IdDocumentType, KycStatus } from "@/lib/types/auth";

export type KycDocumentFile = {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
};

export type KycProviderSubmitInput = {
  userId: string;
  idDocType: IdDocumentType;
  idFront: KycDocumentFile;
  idBack: KycDocumentFile | null;
  selfie: KycDocumentFile;
};

export type KycProviderSubmitResult = {
  provider: string;
  providerRef: string;
  initialStatus: KycStatus;
  docStoragePath: string | null;
  selfieStoragePath: string | null;
};

export type KycWebhookEvent = {
  provider: string;
  providerRef: string;
  status: Extract<KycStatus, "VERIFIED" | "REJECTED" | "EXPIRED">;
  rejectReason: string | null;
};

export interface KycAdapter {
  submitVerification(
    input: KycProviderSubmitInput
  ): Promise<KycProviderSubmitResult>;
  parseWebhookPayload(
    rawBody: string,
    signatureHeader: string | null
  ): Promise<KycWebhookEvent>;
}

function extensionForMime(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

/**
 * Sandbox KYC adapter: validates and discards government ID image bytes in memory
 * so AutoNexa retains zero raw ID copies during development/reference demos (FR-EU-02).
 *
 * TODO(senior-review): Replace SandboxKycAdapter with Persona/Onfido/Trulioo hosted
 * SDK + signed webhook verification before production launch (FR-EU-02).
 */
export class SandboxKycAdapter implements KycAdapter {
  async submitVerification(
    _input: KycProviderSubmitInput
  ): Promise<KycProviderSubmitResult> {
    return {
      provider: "sandbox",
      providerRef: `kyc_sbx_${randomUUID()}`,
      initialStatus: "PENDING",
      docStoragePath: null,
      selfieStoragePath: null,
    };
  }

  async parseWebhookPayload(
    rawBody: string,
    _signatureHeader: string | null
  ): Promise<KycWebhookEvent> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw new BadRequestError("Invalid KYC webhook payload.", "INVALID_JSON");
    }

    const providerRef =
      typeof parsed.providerRef === "string" ? parsed.providerRef : "";
    const status = parsed.status;
    if (
      !providerRef ||
      (status !== "VERIFIED" && status !== "REJECTED" && status !== "EXPIRED")
    ) {
      throw new BadRequestError("Malformed KYC webhook payload.");
    }

    return {
      provider: "sandbox",
      providerRef,
      status,
      rejectReason:
        typeof parsed.rejectReason === "string" ? parsed.rejectReason : null,
    };
  }
}

/**
 * Manual compliance-review KYC adapter: encrypts & stores submitted ID captures
 * into the strictly private `kyc-docs` Supabase bucket for admin review.
 */
export class ManualKycAdapter implements KycAdapter {
  async submitVerification(
    input: KycProviderSubmitInput
  ): Promise<KycProviderSubmitResult> {
    const storage = getStorageAdapter();
    const submissionRef = `kyc_man_${randomUUID()}`;
    const frontPath = `${input.userId}/${submissionRef}/id-front.${extensionForMime(input.idFront.mimeType)}`;
    const selfiePath = `${input.userId}/${submissionRef}/selfie.${extensionForMime(input.selfie.mimeType)}`;

    const uploads: Promise<{ path: string }>[] = [
      storage.uploadBuffer(
        "kyc-docs",
        frontPath,
        input.idFront.bytes,
        input.idFront.mimeType
      ),
      storage.uploadBuffer(
        "kyc-docs",
        selfiePath,
        input.selfie.bytes,
        input.selfie.mimeType
      ),
    ];

    if (input.idBack) {
      const backPath = `${input.userId}/${submissionRef}/id-back.${extensionForMime(input.idBack.mimeType)}`;
      uploads.push(
        storage.uploadBuffer(
          "kyc-docs",
          backPath,
          input.idBack.bytes,
          input.idBack.mimeType
        )
      );
    }

    await Promise.all(uploads);

    return {
      provider: "manual",
      providerRef: submissionRef,
      initialStatus: "PENDING",
      docStoragePath: frontPath,
      selfieStoragePath: selfiePath,
    };
  }

  async parseWebhookPayload(
    _rawBody: string,
    _signatureHeader: string | null
  ): Promise<KycWebhookEvent> {
    throw new BadRequestError(
      "Manual KYC mode does not accept external provider webhooks."
    );
  }
}

/**
 * Selects the configured KYC verification adapter (`sandbox` | `manual` | `provider`).
 */
export function getKycAdapter(): KycAdapter {
  const { kycMode } = getServerEnv();
  if (kycMode === "sandbox") {
    return new SandboxKycAdapter();
  }
  if (kycMode === "manual") {
    return new ManualKycAdapter();
  }

  // TODO(senior-review): Wire Persona/Onfido/Trulioo provider adapter here when KYC_MODE=provider.
  throw new ExternalServiceError(
    "External KYC provider is not configured yet.",
    "EXTERNAL_SERVICE_ERROR"
  );
}
