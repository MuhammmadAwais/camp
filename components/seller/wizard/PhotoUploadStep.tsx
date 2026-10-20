"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Star,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";
import { ListingPhoto, useListingWizardStore } from "@/store/useListingWizardStore";
import { compressListingPhoto } from "@/lib/image-compression";
import { apiClient } from "@/lib/api-client";
import type { PresignedUploadItem } from "@/app/api/listings/media/presign/route";

const RECOMMENDED_ANGLES = [
  "Front 3/4 Angle",
  "Rear 3/4 Angle",
  "Odometer Cluster",
  "Front Cabin & Steering",
  "Rear Seats",
  "Engine Bay",
  "Tire Tread & Rims",
  "Trunk Cargo Area",
];

const MIN_PHOTOS = 8;
const MAX_PHOTOS = 30;

const SAMPLE_GALLERY_PHOTOS: Array<{ name: string; url: string; size: number }> = [
  {
    name: "front_three_quarter.webp",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    size: 1420000,
  },
  {
    name: "rear_three_quarter.webp",
    url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
    size: 1350000,
  },
  {
    name: "driver_cockpit.webp",
    url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    size: 1200000,
  },
  {
    name: "odometer_cluster.webp",
    url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
    size: 980000,
  },
  {
    name: "rear_passenger_seats.webp",
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    size: 1110000,
  },
  {
    name: "engine_bay_v6.webp",
    url: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80",
    size: 1540000,
  },
  {
    name: "alloy_wheel_tread.webp",
    url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
    size: 890000,
  },
  {
    name: "cargo_trunk_open.webp",
    url: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80",
    size: 1040000,
  },
];

interface PhotoUploadStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PhotoUploadStep({ onNext, onBack }: PhotoUploadStepProps) {
  const {
    photos,
    addPhoto,
    removePhoto,
    setCoverPhoto,
    updatePhotoStatus,
    markStepComplete,
  } = useListingWizardStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process selected image files
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    if (photos.length + fileArray.length > MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed. Please select fewer images.`);
      return;
    }

    setUploadError(null);
    setIsProcessing(true);

    for (const rawFile of fileArray) {
      const tempId = crypto.randomUUID();

      // 1. Add temporary pending photo to store
      const initialPreview = URL.createObjectURL(rawFile);
      addPhoto({
        id: tempId,
        previewUrl: initialPreview,
        fileName: rawFile.name,
        fileSizeBytes: rawFile.size,
        isCover: photos.length === 0,
        status: "pending",
        progress: 10,
      });

      try {
        // 2. Client-side compression & EXIF metadata scrubbing
        updatePhotoStatus(tempId, { status: "uploading", progress: 30 });
        const compressed = await compressListingPhoto(rawFile, (p) => {
          updatePhotoStatus(tempId, { progress: Math.min(60, 30 + Math.round(p * 0.3)) });
        });

        // 3. Request presigned URL from API
        updatePhotoStatus(tempId, { progress: 65 });
        const presignRes = await apiClient.api.post<{ items: PresignedUploadItem[] }>(
          "/api/listings/media/presign",
          {
            files: [
              {
                fileName: compressed.file.name,
                fileSizeBytes: compressed.compressedSizeBytes,
                mimeType: compressed.file.type,
              },
            ],
          }
        );

        if (!presignRes.success) {
          throw new Error(presignRes.error || "Failed to obtain upload ticket");
        }

        const presigned = presignRes.data?.items?.[0];
        if (!presigned) {
          throw new Error("No upload ticket returned");
        }

        // 4. Direct PUT upload to S3 (or mock endpoint)
        updatePhotoStatus(tempId, { progress: 85 });
        const uploadRes = await fetch(presigned.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": compressed.file.type,
          },
          body: compressed.file,
        });

        if (!uploadRes.ok) {
          throw new Error("Direct S3 upload failed");
        }

        // 5. Success: update store with S3 key and final preview
        updatePhotoStatus(tempId, {
          s3Key: presigned.s3Key,
          previewUrl: compressed.previewUrl,
          fileSizeBytes: compressed.compressedSizeBytes,
          status: "uploaded",
          progress: 100,
        });
      } catch (err: any) {
        console.error("Upload failure for file:", rawFile.name, err);
        updatePhotoStatus(tempId, {
          status: "error",
          progress: 0,
        });
      }
    }

    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleMovePhoto = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    // Preserve cover photo status on index 0 if needed
    newPhotos.forEach((p, i) => {
      p.isCover = i === 0;
    });

    useListingWizardStore.setState({ photos: newPhotos });
  };

  const handleLoadSamplePhotos = () => {
    const newPhotos: ListingPhoto[] = SAMPLE_GALLERY_PHOTOS.map((item, idx) => ({
      id: `sample-${idx}-${Date.now()}`,
      previewUrl: item.url,
      s3Key: `listings/mock/${item.name}`,
      fileName: item.name,
      fileSizeBytes: item.size,
      isCover: idx === 0,
      status: "uploaded",
      progress: 100,
    }));
    useListingWizardStore.setState({ photos: newPhotos });
    setUploadError(null);
  };

  const handleProceed = () => {
    if (photos.length < MIN_PHOTOS) {
      setUploadError(
        `Please upload at least ${MIN_PHOTOS} photos for dealers to accurately assess vehicle condition.`
      );
      return;
    }
    markStepComplete("media");
    onNext();
  };

  const uploadedCount = photos.filter((p) => p.status === "uploaded").length;
  const isMinMet = photos.length >= MIN_PHOTOS;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary flex items-center gap-1">
            <Camera className="w-3 h-3" />
            <span>Photo Gallery Intake</span>
          </span>
          <span
            className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-md ${
              isMinMet
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {photos.length} / {MAX_PHOTOS} Photos
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Photo Gallery & Direct-to-S3 Upload
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Upload 8 to 30 high-resolution photos. Images are automatically downscaled to 1920px,
          stripped of GPS metadata for privacy, and uploaded directly to encrypted Canadian storage.
        </p>
      </div>

      {/* Recommended Angles Checklist */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-portal-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-portal-primary" />
          <span>Recommended Vehicle Angles</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMENDED_ANGLES.map((angle) => (
            <span
              key={angle}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-portal-surface-hover border border-portal-border text-portal-text-muted font-medium"
            >
              {angle}
            </span>
          ))}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-portal-primary bg-portal-primary/10 scale-[1.01]"
            : "border-portal-border bg-portal-surface hover:border-portal-primary/60 hover:bg-portal-surface-hover"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
          }}
        />

        <div className="w-12 h-12 rounded-full bg-portal-primary/10 text-portal-primary flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-portal-text">
          {isDragging ? "Drop photos here" : "Click to select or drag and drop photos"}
        </p>
        <p className="text-xs text-portal-text-muted mt-1">
          Supports JPG, PNG, WEBP, and HEIC up to 20MB per photo
        </p>

        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-portal-text-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-portal-primary" />
            <span>EXIF GPS metadata stripped</span>
          </span>
          <span>•</span>
          <span>Max 30 photos</span>
        </div>
      </div>

      {/* Demo helper button */}
      {photos.length < MIN_PHOTOS && (
        <div className="flex justify-end">
          <button
            type="button"
            id="load-sample-photos-btn"
            onClick={handleLoadSamplePhotos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-portal-primary bg-portal-primary/10 hover:bg-portal-primary/20 border border-portal-primary/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 8 Showcase Photos (Demo Auto-Fill)</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {uploadError && (
        <div className="p-3 bg-portal-surface-hover border border-error/30 rounded-xl flex items-center gap-2 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Photo Grid Preview */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-portal-text uppercase tracking-wider">
              Selected Gallery ({photos.length})
            </h3>
            <span className="text-[11px] text-portal-text-muted">
              First photo will be used as the auction cover card
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-4/3 rounded-xl overflow-hidden border border-portal-border bg-portal-surface-hover shadow-xs transition-all hover:border-portal-primary/50"
              >
                {/* Image Preview */}
                <img
                  src={photo.previewUrl}
                  alt={`Vehicle angle ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover Photo Badge */}
                {photo.isCover && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-portal-primary text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Cover</span>
                  </div>
                )}

                {/* Upload Status Overlay */}
                {photo.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs p-2">
                    <RefreshCw className="w-4 h-4 animate-spin mb-1 text-portal-primary" />
                    <span className="text-[10px] font-mono">{photo.progress || 50}%</span>
                    <span className="text-[10px] text-white/80">Compressing & Uploading</span>
                  </div>
                )}

                {photo.status === "error" && (
                  <div className="absolute inset-0 bg-error/80 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs p-2 text-center">
                    <AlertCircle className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">Upload failed</span>
                  </div>
                )}

                {/* Hover Action Bar */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  {/* Reorder Left */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, "left")}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-portal-primary transition-colors"
                      title="Move left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Set Cover Action */}
                  {!photo.isCover && (
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(photo.id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-portal-primary transition-colors text-[10px] font-medium"
                      title="Set as cover photo"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Reorder Right */}
                  {index < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMovePhoto(index, "right")}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-portal-primary transition-colors"
                      title="Move right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Photo */}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-error transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Processing Loader */}
      {isProcessing && (
        <div className="p-3 bg-portal-surface-hover rounded-xl border border-portal-border flex items-center gap-2 text-xs text-portal-text">
          <RefreshCw className="w-4 h-4 animate-spin text-portal-primary" />
          <span>Downscaling photos to 1920px WebP & streaming to AWS S3...</span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-portal-border hover:bg-portal-surface-hover text-portal-text-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Condition</span>
        </button>

        <button
          type="button"
          id="btn-continue-to-pricing"
          onClick={handleProceed}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-white bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <span>Continue to Price & Submit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
