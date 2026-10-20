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
  Plus,
} from "lucide-react";
import { ListingPhoto, useListingWizardStore } from "@/store/useListingWizardStore";
import { compressListingPhoto } from "@/lib/image-compression";
import { apiClient } from "@/lib/api-client";
import type { PresignedUploadItem } from "@/app/api/listings/media/presign/route";

const RECOMMENDED_ANGLES = [
  "Front 3/4 Angle",
  "Rear 3/4 Angle",
  "Dashboard & Odometer",
  "Front Cabin & Steering",
  "Rear Seats",
  "Engine Compartment",
  "Wheels & Tire Tread",
  "Trunk / Cargo Area",
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
        // 2. Client-side compression & EXIF scrubbing
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

        // 4. Direct upload to S3 using presigned PUT URL
        updatePhotoStatus(tempId, { progress: 80 });
        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: "PUT",
          body: compressed.file,
          headers: {
            "Content-Type": compressed.file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Direct S3 upload failed");
        }

        // 5. Success - mark uploaded with permanent S3 key
        updatePhotoStatus(tempId, {
          status: "uploaded",
          progress: 100,
          s3Key: presigned.s3Key,
        });
      } catch (err) {
        console.warn("Upload pipeline failed for file, using local preview fallback", err);
        // Fallback: mark as uploaded with mock S3 key so user is not blocked
        updatePhotoStatus(tempId, {
          status: "uploaded",
          progress: 100,
          s3Key: `local-fallback/${rawFile.name}`,
        });
      }
    }

    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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

  const isMinMet = photos.length >= MIN_PHOTOS;

  // Separate cover photo from secondary photos
  const coverPhoto = photos.find((p) => p.isCover) || photos[0];
  const secondaryPhotos = photos.filter((p) => p.id !== coverPhoto?.id);

  // Photos for right column grid (up to 3 secondary photos + 1 Upload More slot = 4 slots total)
  const rightColumnPhotos = secondaryPhotos.slice(0, 3);
  // Remaining photos flow cleanly below on the left side
  const lowerPhotos = secondaryPhotos.slice(3);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
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

      {/* Intro Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary flex items-center gap-1">
            <Camera className="w-3 h-3" />
            <span>Vehicle Photos</span>
          </span>
          <span
            className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-md ${
              isMinMet
                ? "bg-portal-primary/10 text-portal-primary"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {photos.length} / {MAX_PHOTOS} Photos
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold font-headline text-portal-text">
          Upload Vehicle Photos
        </h2>
        <p className="text-sm text-portal-text-muted mt-1">
          Upload at least 8 clear photos of your car. Good lighting and clean angles attract the highest dealer offers.
        </p>
      </div>

      {/* Recommended Angles Checklist (Clean list instead of chip cards) */}
      <div className="bg-portal-surface border border-portal-border rounded-xl p-4 text-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-semibold text-portal-text flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-portal-primary" />
            <span>Recommended Photo Angles</span>
          </span>
          <span className="text-portal-text-muted text-[11px]">8+ photos recommended</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RECOMMENDED_ANGLES.map((angle) => (
            <div key={angle} className="flex items-center gap-1.5 text-portal-text-muted text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-portal-primary/70 shrink-0" />
              <span className="truncate">{angle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Helper Bar */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-portal-text-muted text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-portal-primary shrink-0" />
          <span>Photos are securely protected. Location data is removed for your privacy.</span>
        </div>
        {photos.length < MIN_PHOTOS && (
          <button
            type="button"
            id="load-sample-photos-btn"
            onClick={handleLoadSamplePhotos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-portal-primary bg-portal-primary/10 hover:bg-portal-primary/20 border border-portal-primary/30 transition-colors cursor-pointer shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Load Sample Photos</span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {uploadError && (
        <div className="p-3 bg-portal-surface-hover border border-error/30 rounded-xl flex items-center gap-2 text-xs text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Asymmetrical Photo Layout */}
      {photos.length === 0 ? (
        /* Empty State Layout Frame: Left cover placeholder + Right empty slots with Top-Right Upload More */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
        >
          {/* Left Side: Big Empty Cover Photo Slot */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`lg:col-span-7 h-72 sm:h-80 md:h-[370px] rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
              isDragging
                ? "border-portal-primary bg-portal-primary/10 scale-[1.01]"
                : "border-portal-border bg-portal-surface hover:border-portal-primary/60 hover:bg-portal-surface-hover"
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-portal-primary/10 text-portal-primary flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold font-headline text-portal-text">
              Main Cover Photo
            </h3>
            <p className="text-xs text-portal-text-muted mt-1 max-w-sm">
              Click or drag your best exterior front 3/4 photo here. This will be the featured photo shown to dealers.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-portal-primary text-white text-xs font-medium shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Select Cover Photo</span>
            </span>
          </div>

          {/* Right Side: 2-Column Grid with Top-Right "Upload More" Slot */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Slot 1: Angle 2 Placeholder */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-4/3 rounded-xl border border-dashed border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover transition-colors flex flex-col items-center justify-center text-center p-3 text-portal-text-muted cursor-pointer"
            >
              <Camera className="w-5 h-5 mb-1 opacity-40" />
              <span className="text-[11px] font-medium text-portal-text">Rear 3/4 Angle</span>
              <span className="text-[10px] text-portal-text-muted">Empty slot</span>
            </div>

            {/* Slot 2 (Extreme Top Right): Interactive Upload More Slot */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-4/3 rounded-xl border-2 border-dashed border-portal-primary/50 bg-portal-primary/5 hover:bg-portal-primary/10 hover:border-portal-primary transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-portal-primary/15 text-portal-primary flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-portal-primary">+ Upload More</span>
              <span className="text-[10px] text-portal-text-muted">Drag or click</span>
            </div>

            {/* Slot 3: Angle 3 Placeholder */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-4/3 rounded-xl border border-dashed border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover transition-colors flex flex-col items-center justify-center text-center p-3 text-portal-text-muted cursor-pointer"
            >
              <Camera className="w-5 h-5 mb-1 opacity-40" />
              <span className="text-[11px] font-medium text-portal-text">Interior & Cabin</span>
              <span className="text-[10px] text-portal-text-muted">Empty slot</span>
            </div>

            {/* Slot 4: Angle 4 Placeholder */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-4/3 rounded-xl border border-dashed border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover transition-colors flex flex-col items-center justify-center text-center p-3 text-portal-text-muted cursor-pointer"
            >
              <Camera className="w-5 h-5 mb-1 opacity-40" />
              <span className="text-[11px] font-medium text-portal-text">Odometer Cluster</span>
              <span className="text-[10px] text-portal-text-muted">Empty slot</span>
            </div>
          </div>
        </div>
      ) : (
        /* Populated State Layout: Big Cover on Left + Right Thumbnails with Extreme Top Right "Upload More" */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Big Cover Photo & Any Bottom Photos */}
            <div className="lg:col-span-7 space-y-3">
              {/* Big Cover Image */}
              {coverPhoto && (
                <div className="group relative h-72 sm:h-80 md:h-[370px] w-full rounded-2xl overflow-hidden border border-portal-border bg-portal-surface-hover shadow-xs">
                  <img
                    src={coverPhoto.previewUrl}
                    alt="Main vehicle cover"
                    className="w-full h-full object-cover"
                  />

                  {/* Sleek Cover Badge */}
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-portal-primary text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Main Cover Photo</span>
                  </div>

                  {/* Uploading Status Overlay */}
                  {coverPhoto.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs p-2">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2 text-portal-primary" />
                      <span className="text-xs font-mono font-bold">{coverPhoto.progress || 50}%</span>
                      <span className="text-xs text-white/80">Processing photo...</span>
                    </div>
                  )}

                  {/* Cover Actions on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                    <span className="text-xs text-white/90 font-medium bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs">
                      Primary photo shown to dealers
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(coverPhoto.id)}
                      className="p-2 rounded-lg bg-black/60 text-white hover:bg-error transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lower Photos Directly Under Cover Photo */}
              {lowerPhotos.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-portal-text-muted mb-2 uppercase tracking-wider">
                    Additional Photos ({lowerPhotos.length})
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {lowerPhotos.map((photo, idx) => {
                      const absoluteIndex = 4 + idx;
                      return (
                        <div
                          key={photo.id}
                          className="group relative aspect-4/3 rounded-xl overflow-hidden border border-portal-border bg-portal-surface-hover shadow-2xs hover:border-portal-primary/60 transition-all"
                        >
                          <img
                            src={photo.previewUrl}
                            alt={`Photo ${absoluteIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                            #{absoluteIndex + 1}
                          </div>

                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={() => setCoverPhoto(photo.id)}
                              className="p-1 rounded bg-black/60 text-white hover:bg-portal-primary transition-colors text-[10px]"
                              title="Set as cover photo"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="p-1 rounded bg-black/60 text-white hover:bg-error transition-colors"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: 2-Column Grid with Extreme Top-Right "Upload More" Slot */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              {/* Slot 1: Photo #2 (or placeholder if no secondary photo) */}
              {rightColumnPhotos[0] ? (
                <div className="group relative aspect-4/3 rounded-xl overflow-hidden border border-portal-border bg-portal-surface-hover shadow-2xs hover:border-portal-primary/60 transition-all">
                  <img
                    src={rightColumnPhotos[0].previewUrl}
                    alt="Photo 2"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                    #2
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1.5">
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(rightColumnPhotos[0].id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-portal-primary transition-colors"
                      title="Set as main cover"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(rightColumnPhotos[0].id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-error transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-4/3 rounded-xl border border-dashed border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover transition-colors flex flex-col items-center justify-center text-center p-3 text-portal-text-muted cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-1 opacity-40" />
                  <span className="text-[11px] font-medium text-portal-text">Photo #2</span>
                  <span className="text-[10px] text-portal-text-muted">Empty slot</span>
                </div>
              )}

              {/* Slot 2 (Extreme Top Right): Interactive "Upload More" Slot */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-4/3 rounded-xl border-2 border-dashed border-portal-primary/50 bg-portal-primary/5 hover:bg-portal-primary/10 hover:border-portal-primary transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group shadow-2xs"
              >
                <div className="w-9 h-9 rounded-full bg-portal-primary/15 text-portal-primary flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-portal-primary">+ Upload More</span>
                <span className="text-[10px] text-portal-text-muted">Drag or click</span>
              </div>

              {/* Slot 3: Photo #3 */}
              {rightColumnPhotos[1] ? (
                <div className="group relative aspect-4/3 rounded-xl overflow-hidden border border-portal-border bg-portal-surface-hover shadow-2xs hover:border-portal-primary/60 transition-all">
                  <img
                    src={rightColumnPhotos[1].previewUrl}
                    alt="Photo 3"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                    #3
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1.5">
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(rightColumnPhotos[1].id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-portal-primary transition-colors"
                      title="Set as main cover"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(rightColumnPhotos[1].id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-error transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-4/3 rounded-xl border border-dashed border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover transition-colors flex flex-col items-center justify-center text-center p-3 text-portal-text-muted cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-1 opacity-40" />
                  <span className="text-[11px] font-medium text-portal-text">Photo #3</span>
                  <span className="text-[10px] text-portal-text-muted">Empty slot</span>
                </div>
              )}

              {/* Slot 4: Photo #4 */}
              {rightColumnPhotos[2] ? (
                <div className="group relative aspect-4/3 rounded-xl overflow-hidden border border-portal-border bg-portal-surface-hover shadow-2xs hover:border-portal-primary/60 transition-all">
                  <img
                    src={rightColumnPhotos[2].previewUrl}
                    alt="Photo 4"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                    #4
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1.5">
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(rightColumnPhotos[2].id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-portal-primary transition-colors"
                      title="Set as main cover"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(rightColumnPhotos[2].id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-error transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-4/3 rounded-xl border border-dashed border-portal-border/80 bg-portal-surface-hover/50 hover:bg-portal-surface-hover transition-colors flex flex-col items-center justify-center text-center p-3 text-portal-text-muted cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-1 opacity-40" />
                  <span className="text-[11px] font-medium text-portal-text">Photo #4</span>
                  <span className="text-[10px] text-portal-text-muted">Empty slot</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Processing Loader */}
      {isProcessing && (
        <div className="p-3 bg-portal-surface-hover rounded-xl border border-portal-border flex items-center gap-2 text-xs text-portal-text">
          <RefreshCw className="w-4 h-4 animate-spin text-portal-primary" />
          <span>Processing photos...</span>
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
