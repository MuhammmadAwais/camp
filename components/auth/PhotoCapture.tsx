"use client";

import { useEffect, useId, useMemo } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_KYC_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

interface Props {
  label: string;
  instruction: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  capture?: "user" | "environment";
  aspect?: "card" | "portrait";
}

export function validateKycPhoto(file: File): string | null {
  if (!ACCEPT.split(",").includes(file.type)) return "Use a JPG, PNG, WEBP or HEIC photo";
  if (file.size > MAX_KYC_PHOTO_BYTES) return "Photo must be 10 MB or smaller";
  return null;
}

// Tap-to-capture tile: opens the camera on phones (via `capture`) and the file picker on desktop.
export function PhotoCapture({ label, instruction, file, onChange, error, capture = "environment", aspect = "card" }: Props) {
  const inputId = useId();
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-1.5">
      <span className="block font-body text-sm font-semibold text-on-surface">{label}</span>
      <label
        htmlFor={inputId}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed bg-surface-container-low cursor-pointer transition-colors hover:bg-surface-container focus-within:ring-2 focus-within:ring-primary/40",
          aspect === "card" ? "aspect-[1.586/1]" : "aspect-[3/4] max-w-[220px] mx-auto w-full",
          error ? "border-error" : file ? "border-primary" : "border-outline-variant"
        )}
      >
        {previewUrl ? (
          <>
            {/* Blob preview of a local file — next/image can't optimise object URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-on-surface/85 px-2.5 py-1 font-body text-xs font-semibold text-white">
              <RefreshCw className="w-3 h-3" aria-hidden /> Retake
            </span>
          </>
        ) : (
          <>
            <span className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <Camera className="w-5 h-5" aria-hidden />
            </span>
            <span className="px-4 text-center font-body text-xs text-on-surface-variant leading-relaxed">{instruction}</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          capture={capture}
          className="sr-only"
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null);
            e.target.value = ""; // Allow re-selecting the same file after a retake.
          }}
        />
      </label>
      {error && (
        <p role="alert" className="font-body text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
