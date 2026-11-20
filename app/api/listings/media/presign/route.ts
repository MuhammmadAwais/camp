import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getStorageAdapter } from "@/lib/server/adapters/storage.adapter";
import { requireRole } from "@/lib/server/auth";
import { handleApiRoute, ok, parseBody } from "@/lib/server/http";

const presignPayloadSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().trim().min(1),
        fileSizeBytes: z
          .number()
          .int()
          .positive()
          .max(20 * 1024 * 1024, "File exceeds 20MB limit"),
        mimeType: z
          .string()
          .regex(
            /^image\/(jpeg|jpg|png|webp|heic|heif)$/i,
            "Unsupported image format"
          ),
      })
    )
    .min(1, "At least 1 file required")
    .max(35, "Maximum 35 files per batch"),
});

export type PresignedUploadItem = {
  fileName: string;
  s3Key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
};

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
 * POST /api/listings/media/presign
 * Generates signed direct upload URLs scoped to the caller's folder in Supabase Storage.
 */
export const POST = handleApiRoute(async (request: NextRequest) => {
  const ctx = await requireRole(["SELLER", "ADMIN"]);
  const { files } = await parseBody(request, presignPayloadSchema);
  const storage = getStorageAdapter();
  const timestamp = Date.now();

  const items: PresignedUploadItem[] = await Promise.all(
    files.map(async (file) => {
      const ext = extensionForMime(file.mimeType);
      const s3Key = `${ctx.userId}/${timestamp}/${randomUUID()}.${ext}`;
      const signed = await storage.createSignedUploadUrl(
        "listing-media",
        s3Key,
        file.mimeType
      );
      const publicUrl = storage.getPublicUrl("listing-media", signed.path);

      return {
        fileName: file.fileName,
        s3Key: signed.path,
        uploadUrl: signed.uploadUrl,
        publicUrl,
        expiresInSeconds: signed.expiresInSeconds,
      };
    })
  );

  return ok({ items });
});
