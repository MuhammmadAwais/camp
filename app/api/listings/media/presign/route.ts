import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mockApiDisabled, ok, parseJson, simulateLatency } from "@/lib/mock/http";

const presignPayloadSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().min(1),
        fileSizeBytes: z.number().int().positive().max(20 * 1024 * 1024, "File exceeds 20MB limit"),
        mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp|heic|heif)$/i, "Unsupported image format"),
      })
    )
    .min(1, "At least 1 file required")
    .max(35, "Maximum 35 files per batch"),
});

export type PresignedUploadItem = {
  fileName: string;
  s3Key: string;
  uploadUrl: string;
  expiresInSeconds: number;
};

// POST /api/listings/media/presign
// Generates direct-to-S3 presigned PUT URLs (ca-central-1)
export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  const parsed = await parseJson(request, presignPayloadSchema);
  if ("response" in parsed) return parsed.response;

  await simulateLatency(300);

  const { files } = parsed.data;
  const timestamp = Date.now();

  const presignedItems: PresignedUploadItem[] = files.map((file, index) => {
    const extension = file.fileName.split(".").pop()?.toLowerCase() || "webp";
    const uniqueId = crypto.randomUUID();
    const s3Key = `listings/media/${timestamp}/${uniqueId}.${extension}`;

    // Mock direct PUT upload endpoint for development
    const uploadUrl = `/api/mock/s3-upload?key=${encodeURIComponent(s3Key)}`;

    return {
      fileName: file.fileName,
      s3Key,
      uploadUrl,
      expiresInSeconds: 900,
    };
  });

  return ok({ items: presignedItems });
}
