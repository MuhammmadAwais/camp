import {
  getKycAdapter,
  type KycProviderSubmitInput,
} from "@/lib/server/adapters/kyc.adapter";
import type { SessionContext } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";
import { ConflictError, ExternalServiceError } from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { KycStatusResponse } from "@/lib/types/auth";

export const SANDBOX_AUTO_VERIFY_DELAY_MS = 4_000;

/**
 * Throws 409 immediately if the user's KYC is already VERIFIED or currently PENDING review.
 */
export function assertKycCanSubmit(ctx: SessionContext): void {
  if (ctx.kycStatus === "VERIFIED") {
    throw new ConflictError(
      "Your identity is already verified.",
      "KYC_ALREADY_VERIFIED"
    );
  }
  if (ctx.kycStatus === "PENDING") {
    throw new ConflictError(
      "Your verification is already being reviewed.",
      "KYC_PENDING"
    );
  }
}

/**
 * Submits seller government ID + selfie verification through the active KYC adapter,
 * records `KYC_BIOMETRIC` consent, persists `kyc_submissions` + `profiles`, and writes an audit entry.
 */
export async function submitKycVerification(
  ctx: SessionContext,
  input: Omit<KycProviderSubmitInput, "userId">,
  requestMeta: { ipAddress: string | null; userAgent: string | null }
): Promise<KycStatusResponse> {
  assertKycCanSubmit(ctx);

  const admin = createAdminSupabaseClient();
  const { error: consentErr } = await admin.from("user_consents").insert({
    user_id: ctx.userId,
    consent_type: "KYC_BIOMETRIC",
    granted: true,
    policy_version: "1.0",
    ip_address: requestMeta.ipAddress,
    user_agent: requestMeta.userAgent,
  });

  if (consentErr) {
    throw new ExternalServiceError(
      "Unable to record identity verification consent.",
      "EXTERNAL_SERVICE_ERROR",
      consentErr
    );
  }

  const providerResult = await getKycAdapter().submitVerification({
    userId: ctx.userId,
    ...input,
  });

  const nowIso = new Date().toISOString();
  const { data: submission, error: subErr } = await admin
    .from("kyc_submissions")
    .upsert(
      {
        user_id: ctx.userId,
        provider: providerResult.provider,
        provider_ref: providerResult.providerRef,
        id_doc_type: input.idDocType,
        doc_storage_path: providerResult.docStoragePath,
        selfie_storage_path: providerResult.selfieStoragePath,
        status: providerResult.initialStatus,
        reject_reason: null,
        submitted_at: nowIso,
        verified_at: null,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (subErr || !submission) {
    throw new ExternalServiceError(
      "Unable to save KYC verification submission.",
      "EXTERNAL_SERVICE_ERROR",
      subErr
    );
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ kyc_status: providerResult.initialStatus })
    .eq("id", ctx.userId);

  if (profileErr) {
    throw new ExternalServiceError(
      "Unable to update profile KYC status.",
      "EXTERNAL_SERVICE_ERROR",
      profileErr
    );
  }

  const actorName = `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim();
  const { error: auditErr } = await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName || ctx.email,
    actor_role: ctx.role,
    action: "KYC_SUBMITTED",
    entity_type: "kyc_submission",
    entity_id: submission.id,
    provincial_jurisdiction: ctx.profile.province,
    ip_address: requestMeta.ipAddress,
    after_json: {
      provider: providerResult.provider,
      idDocType: input.idDocType,
      status: providerResult.initialStatus,
    },
  });

  if (auditErr) {
    throw new ExternalServiceError(
      "Unable to record KYC audit entry.",
      "EXTERNAL_SERVICE_ERROR",
      auditErr
    );
  }

  return {
    status: submission.status,
    rejectReason: submission.reject_reason,
    submittedAt: submission.submitted_at,
  };
}

/**
 * Loads the caller's latest KYC status and transitions sandbox `PENDING` submissions
 * cleanly to `VERIFIED` after the simulated verification delay.
 */
export async function getKycStatusForUser(
  ctx: SessionContext
): Promise<KycStatusResponse> {
  const admin = createAdminSupabaseClient();
  const { data: submission, error } = await admin
    .from("kyc_submissions")
    .select("*")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (error) {
    throw new ExternalServiceError(
      "Unable to load KYC verification status.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  if (!submission) {
    return {
      status: ctx.kycStatus,
      rejectReason: null,
      submittedAt: null,
    };
  }

  const { kycMode } = getServerEnv();
  const elapsedMs = Date.now() - new Date(submission.submitted_at).getTime();

  if (
    submission.status === "PENDING" &&
    submission.provider === "sandbox" &&
    kycMode === "sandbox" &&
    elapsedMs >= SANDBOX_AUTO_VERIFY_DELAY_MS
  ) {
    const nowIso = new Date().toISOString();
    const { data: updated, error: updateErr } = await admin
      .from("kyc_submissions")
      .update({
        status: "VERIFIED",
        verified_at: nowIso,
        reject_reason: null,
      })
      .eq("id", submission.id)
      .eq("status", "PENDING")
      .select("*")
      .maybeSingle();

    if (updateErr) {
      throw new ExternalServiceError(
        "Unable to finalize sandbox KYC verification.",
        "EXTERNAL_SERVICE_ERROR",
        updateErr
      );
    }

    if (updated) {
      await admin
        .from("profiles")
        .update({ kyc_status: "VERIFIED" })
        .eq("id", ctx.userId);

      const actorName = `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim();
      await admin.from("audit_logs").insert({
        actor_id: ctx.userId,
        actor_name: actorName || ctx.email,
        actor_role: ctx.role,
        action: "KYC_VERIFIED",
        entity_type: "kyc_submission",
        entity_id: updated.id,
        provincial_jurisdiction: ctx.profile.province,
        after_json: { provider: "sandbox", status: "VERIFIED" },
      });

      return {
        status: "VERIFIED",
        rejectReason: null,
        submittedAt: updated.submitted_at,
      };
    }
  }

  return {
    status: submission.status,
    rejectReason: submission.reject_reason,
    submittedAt: submission.submitted_at,
  };
}
