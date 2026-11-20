"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  useEnrollTotp,
  useMfaFactors,
  useUnenrollTotp,
  useVerifyTotp,
} from "@/hooks/useMfa";
import { ApiError } from "@/lib/api-client";
import type { MfaEnrollResponse } from "@/lib/types/auth";

interface MfaSettingsCardProps {
  mandatoryPrompt?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const emptySubscribe = () => () => {};

function formatDateLabel(iso: string, mounted: boolean): string {
  if (!mounted) return iso.slice(0, 10);
  try {
    return new Date(iso).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function MfaSettingsCard({
  mandatoryPrompt = false,
  onSuccess,
  onError,
}: MfaSettingsCardProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const factorsQuery = useMfaFactors();
  const enrollTotp = useEnrollTotp();
  const verifyTotp = useVerifyTotp();
  const unenrollTotp = useUnenrollTotp();

  const [friendlyName, setFriendlyName] = useState("AutoNexa Authenticator");
  const [pendingEnrollment, setPendingEnrollment] =
    useState<MfaEnrollResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [stepUpFactorId, setStepUpFactorId] = useState<string>("");
  const [stepUpCode, setStepUpCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  const mfa = factorsQuery.data;
  const verifiedFactors = (mfa?.factors ?? []).filter(
    (f) => f.status === "verified"
  );
  const effectiveStepUpFactorId =
    stepUpFactorId || verifiedFactors[0]?.id || "";
  const isAal2 = mfa?.currentLevel === "aal2";
  const needsMandatorySetup = Boolean(mfa?.mfaRequiredForRole && !mfa.mfaEnabled);
  const needsStepUp = Boolean(
    mfa?.mfaEnabled && !isAal2 && verifiedFactors.length > 0 && !pendingEnrollment
  );

  const handleStartEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const enrolled = await enrollTotp.mutateAsync({
        friendlyName: friendlyName.trim() || "AutoNexa Authenticator",
      });
      setPendingEnrollment(enrolled);
      setVerifyCode("");
    } catch (err) {
      onError?.(
        err instanceof ApiError
          ? err.message
          : "Unable to generate TOTP enrollment QR code."
      );
    }
  };

  const handleCopySecret = async () => {
    if (!pendingEnrollment?.secret) return;
    try {
      await navigator.clipboard.writeText(pendingEnrollment.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      onError?.("Clipboard permission denied. Copy the Base32 secret manually.");
    }
  };

  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEnrollment) return;

    try {
      await verifyTotp.mutateAsync({
        factorId: pendingEnrollment.factorId,
        code: verifyCode.replace(/\D/g, ""),
      });
      setPendingEnrollment(null);
      setVerifyCode("");
      onSuccess?.(
        "TOTP authenticator verified. Your session is now elevated to AAL2."
      );
    } catch (err) {
      onError?.(
        err instanceof ApiError
          ? err.message
          : "Invalid 6-digit authenticator code."
      );
    }
  };

  const handleStepUpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStepUpFactorId) return;

    try {
      await verifyTotp.mutateAsync({
        factorId: effectiveStepUpFactorId,
        code: stepUpCode.replace(/\D/g, ""),
      });
      setStepUpCode("");
      onSuccess?.("Session elevated to AAL2 via TOTP verification.");
    } catch (err) {
      onError?.(
        err instanceof ApiError
          ? err.message
          : "Invalid 6-digit authenticator code."
      );
    }
  };

  const handleRemoveFactor = async (factorId: string) => {
    try {
      await unenrollTotp.mutateAsync({ factorId });
      onSuccess?.("TOTP authenticator factor removed.");
    } catch (err) {
      onError?.(
        err instanceof ApiError
          ? err.message
          : "Unable to remove TOTP authenticator factor."
      );
    }
  };

  return (
    <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-portal-border/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-headline font-bold text-base text-portal-text">
              Two-Factor Authentication (TOTP / AAL2)
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isAal2
                  ? "bg-success/10 text-success border-success/25"
                  : "bg-warning/10 text-warning border-warning/25"
              }`}
            >
              {isAal2 ? "AAL2 VERIFIED" : "AAL1 SESSION"}
            </span>
          </div>
          <p className="text-xs text-portal-text-muted mt-1 max-w-2xl">
            Hardware or mobile TOTP authenticator (1Password, Google Authenticator,
            Authy). Required for Platform Administrators and Dealership Admins
            (NFR-06).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mfa?.mfaEnabled ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-success">
              <ShieldCheck className="w-4 h-4" />
              <span>TOTP Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-warning">
              <ShieldAlert className="w-4 h-4" />
              <span>Not Enrolled</span>
            </span>
          )}
        </div>
      </div>

      {/* Mandatory Policy Notice for Privileged Roles */}
      {(mandatoryPrompt || needsMandatorySetup) && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3 text-xs text-portal-text">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Mandatory TOTP Enrollment Required for Your Role
            </p>
            <p className="text-portal-text-muted">
              Sensitive administrative and dealership management mutations are
              protected until you enroll a TOTP authenticator and verify your
              session at AAL2.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {factorsQuery.isLoading && !mfa ? (
        <div className="py-6 flex items-center gap-2 text-xs text-portal-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-portal-primary" />
          <span>Checking live authenticator factors...</span>
        </div>
      ) : (
        <>
          {/* Existing Verified Factors */}
          {verifiedFactors.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-portal-text-muted font-mono">
                Enrolled Authenticator Factors
              </h4>
              <div className="space-y-2">
                {verifiedFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className="p-3.5 rounded-xl border border-portal-border bg-portal-surface-hover/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-portal-text truncate">
                          {factor.friendlyName}
                        </p>
                        <p className="text-[11px] text-portal-text-muted font-mono">
                          TOTP • Added {formatDateLabel(factor.createdAt, mounted)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={unenrollTotp.isPending}
                      onClick={() => handleRemoveFactor(factor.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-xs font-semibold text-portal-text-muted hover:text-error transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-Up Challenge Form (if enrolled but currently AAL1) */}
          {needsStepUp && (
            <form
              onSubmit={handleStepUpVerify}
              className="p-4 rounded-xl border border-portal-primary/30 bg-portal-primary/[0.04] space-y-3"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-portal-text">
                  Elevate Current Session to AAL2
                </p>
                <p className="text-[11px] text-portal-text-muted">
                  Enter a 6-digit code from your authenticator app to unlock
                  privileged mutations for this session.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {verifiedFactors.length > 1 && (
                  <select
                    value={effectiveStepUpFactorId}
                    onChange={(e) => setStepUpFactorId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-portal-border bg-portal-surface text-xs text-portal-text font-semibold"
                  >
                    {verifiedFactors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.friendlyName}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={stepUpCode}
                  onChange={(e) => setStepUpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code (e.g. 482910)"
                  className="flex-1 px-3 py-2 rounded-xl border border-portal-border bg-portal-surface text-xs font-mono text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                />
                <button
                  type="submit"
                  disabled={verifyTotp.isPending || stepUpCode.length !== 6}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-on-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyTotp.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Verify Session</span>
                </button>
              </div>
            </form>
          )}

          {/* Pending QR Enrollment Flow */}
          {pendingEnrollment ? (
            <form
              onSubmit={handleConfirmEnrollment}
              className="p-5 rounded-xl border border-portal-primary/30 bg-portal-surface-hover/40 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-portal-text font-headline">
                    Scan QR Code with Your Authenticator App
                  </h4>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Scan the SVG QR code or enter the Base32 secret manually, then
                    verify with the current 6-digit code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingEnrollment(null);
                    setVerifyCode("");
                  }}
                  className="text-xs font-semibold text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="p-2 rounded-xl bg-on-primary border border-portal-border shrink-0">
                  <Image
                    src={pendingEnrollment.qrCode}
                    alt="AutoNexa TOTP Authenticator QR Code"
                    width={168}
                    height={168}
                    unoptimized
                    className="w-40 h-40"
                  />
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-portal-text-muted font-mono block mb-1">
                      Manual Entry Secret (Base32)
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-lg bg-portal-surface border border-portal-border text-xs font-mono text-portal-text break-all select-all">
                        {pendingEnrollment.secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-2 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text transition-colors cursor-pointer shrink-0"
                        title="Copy TOTP secret"
                      >
                        {copiedSecret ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1">
                      Confirm 6-Digit Authenticator Code
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) =>
                          setVerifyCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="000000"
                        className="flex-1 px-3 py-2 rounded-xl border border-portal-border bg-portal-surface text-sm font-mono font-bold tracking-widest text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                      />
                      <button
                        type="submit"
                        disabled={verifyTotp.isPending || verifyCode.length !== 6}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-on-primary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {verifyTotp.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        <span>Activate MFA</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Start New Factor Enrollment Form */
            <form
              onSubmit={handleStartEnroll}
              className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="flex-1">
                <label className="block text-xs font-bold text-portal-text mb-1.5">
                  {verifiedFactors.length > 0
                    ? "Add Backup Authenticator Label"
                    : "Authenticator Device Label"}
                </label>
                <input
                  type="text"
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Work iPhone 16 Pro"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                />
              </div>

              <button
                type="submit"
                disabled={enrollTotp.isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-on-primary text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
              >
                {enrollTotp.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                <span>
                  {verifiedFactors.length > 0
                    ? "Add Another Authenticator"
                    : "Setup TOTP Authenticator"}
                </span>
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
