import { getServerEnv } from "@/lib/server/env";
import { ExternalServiceError } from "@/lib/server/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type StorageBucket = "listing-media" | "kyc-docs" | "dispute-evidence";

export type SignedUploadResult = {
  uploadUrl: string;
  token: string;
  path: string;
  expiresInSeconds: number;
};

export interface StorageAdapter {
  createSignedUploadUrl(
    bucket: StorageBucket,
    objectPath: string,
    contentType: string
  ): Promise<SignedUploadResult>;
  getPublicUrl(bucket: StorageBucket, objectPath: string): string;
  createSignedReadUrl(
    bucket: StorageBucket,
    objectPath: string,
    expiresInSeconds?: number
  ): Promise<string>;
  uploadBuffer(
    bucket: StorageBucket,
    objectPath: string,
    body: Uint8Array | ArrayBuffer | Buffer,
    contentType: string
  ): Promise<{ path: string }>;
  deleteObject(
    bucket: StorageBucket,
    objectPaths: string | string[]
  ): Promise<void>;
}

const SIGNED_UPLOAD_TTL_SECONDS = 7200;
const DEFAULT_SIGNED_READ_TTL_SECONDS = 900;

function normalizeObjectPath(objectPath: string): string {
  return objectPath.replace(/^\/+/, "");
}

/**
 * Supabase Storage implementation for direct presigned uploads, public CDN URLs,
 * and private bucket signed read URLs.
 *
 * TODO(senior-review): Add S3StorageAdapter (AWS SDK v3 ca-central-1 + CloudFront)
 * in Prompt B8.3 for production multi-CDN offload.
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly admin = createAdminSupabaseClient();

  async createSignedUploadUrl(
    bucket: StorageBucket,
    objectPath: string,
    _contentType: string
  ): Promise<SignedUploadResult> {
    const cleanPath = normalizeObjectPath(objectPath);
    const { data, error } = await this.admin.storage
      .from(bucket)
      .createSignedUploadUrl(cleanPath, { upsert: false });

    if (error || !data) {
      throw new ExternalServiceError(
        "Unable to issue signed upload URL.",
        "EXTERNAL_SERVICE_ERROR",
        error
      );
    }

    return {
      uploadUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
    };
  }

  getPublicUrl(bucket: StorageBucket, objectPath: string): string {
    const cleanPath = normalizeObjectPath(objectPath);
    const { data } = this.admin.storage.from(bucket).getPublicUrl(cleanPath);
    return data.publicUrl;
  }

  async createSignedReadUrl(
    bucket: StorageBucket,
    objectPath: string,
    expiresInSeconds = DEFAULT_SIGNED_READ_TTL_SECONDS
  ): Promise<string> {
    const cleanPath = normalizeObjectPath(objectPath);
    const { data, error } = await this.admin.storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data) {
      throw new ExternalServiceError(
        "Unable to issue signed read URL.",
        "EXTERNAL_SERVICE_ERROR",
        error
      );
    }

    return data.signedUrl;
  }

  async uploadBuffer(
    bucket: StorageBucket,
    objectPath: string,
    body: Uint8Array | ArrayBuffer | Buffer,
    contentType: string
  ): Promise<{ path: string }> {
    const cleanPath = normalizeObjectPath(objectPath);
    const { data, error } = await this.admin.storage
      .from(bucket)
      .upload(cleanPath, body, { contentType, upsert: false });

    if (error || !data) {
      throw new ExternalServiceError(
        "Unable to store file object.",
        "EXTERNAL_SERVICE_ERROR",
        error
      );
    }

    return { path: data.path };
  }

  async deleteObject(
    bucket: StorageBucket,
    objectPaths: string | string[]
  ): Promise<void> {
    const paths = (Array.isArray(objectPaths) ? objectPaths : [objectPaths])
      .map(normalizeObjectPath)
      .filter((p) => p.length > 0);

    if (paths.length === 0) return;

    const { error } = await this.admin.storage.from(bucket).remove(paths);
    if (error) {
      throw new ExternalServiceError(
        "Unable to remove storage object.",
        "EXTERNAL_SERVICE_ERROR",
        error
      );
    }
  }
}

/**
 * Returns the active configured storage backend (`supabase` or future `s3`).
 */
export function getStorageAdapter(): StorageAdapter {
  const { storageDriver } = getServerEnv();
  if (storageDriver === "supabase") {
    return new SupabaseStorageAdapter();
  }

  throw new ExternalServiceError(
    "AWS S3 storage driver is not configured yet.",
    "EXTERNAL_SERVICE_ERROR"
  );
}
