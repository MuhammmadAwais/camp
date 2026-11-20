import { createHash, createHmac } from "node:crypto";
import { z } from "zod";
import { getServerEnv, type ServerEnv } from "@/lib/server/env";
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
const MAX_S3_PRESIGN_TTL_SECONDS = 604800; // 7 days max SigV4 limit

export const s3StorageConfigSchema = z.object({
  region: z.string().trim().min(2).default("ca-central-1"),
  bucket: z.string().trim().min(3),
  accessKeyId: z.string().trim().min(1),
  secretAccessKey: z.string().trim().min(1),
  publicBaseUrl: z.string().url().optional(),
});

export type S3StorageConfig = z.output<typeof s3StorageConfigSchema>;

function normalizeObjectPath(objectPath: string): string {
  return objectPath.replace(/^\/+/, "");
}

function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeS3ObjectKey(key: string): string {
  return normalizeObjectPath(key)
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(rfc3986Encode)
    .join("/");
}

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function formatAmzDates(now = new Date()): {
  amzDate: string;
  dateStamp: string;
} {
  const iso = now.toISOString();
  const dateStamp = iso.slice(0, 10).replace(/-/g, "");
  const amzDate = `${dateStamp}T${iso.slice(11, 19).replace(/:/g, "")}Z`;
  return { amzDate, dateStamp };
}

function deriveSigV4SigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service = "s3"
): Buffer {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function toNodeBuffer(body: Uint8Array | ArrayBuffer | Buffer): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
}

/**
 * Validates and extracts AWS S3 `ca-central-1` storage configuration from environment variables.
 */
export function resolveS3StorageConfig(
  env: ServerEnv = getServerEnv()
): S3StorageConfig {
  const parsed = s3StorageConfigSchema.safeParse({
    region: env.awsRegion ?? "ca-central-1",
    bucket: env.awsS3Bucket ?? "",
    accessKeyId: env.awsAccessKeyId ?? "",
    secretAccessKey: env.awsSecretAccessKey ?? "",
    publicBaseUrl: env.awsCloudfrontUrl,
  });

  if (!parsed.success) {
    throw new ExternalServiceError(
      "AWS S3 storage driver requires AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY (region defaults to ca-central-1).",
      "STORAGE_NOT_CONFIGURED"
    );
  }

  return parsed.data;
}

/**
 * Supabase Storage implementation for direct presigned uploads, public CDN URLs,
 * and private bucket signed read URLs.
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly admin = createAdminSupabaseClient();

  async createSignedUploadUrl(
    bucket: StorageBucket,
    objectPath: string
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
 * Drop-in AWS S3 (`ca-central-1` Montreal) StorageAdapter using pure Node
 * AWS Signature Version 4 signing (zero additional SDK dependencies).
 */
export class S3StorageAdapter implements StorageAdapter {
  constructor(private readonly config: S3StorageConfig) {}

  private getHost(): string {
    return `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
  }

  private getObjectKey(bucket: StorageBucket, objectPath: string): string {
    const cleanPath = normalizeObjectPath(objectPath);
    return cleanPath ? `${bucket}/${cleanPath}` : bucket;
  }

  private signPresignedUrl(
    method: "GET" | "PUT",
    bucket: StorageBucket,
    objectPath: string,
    expiresInSeconds: number
  ): { url: string; signature: string; path: string } {
    const cleanPath = normalizeObjectPath(objectPath);
    const encodedKey = encodeS3ObjectKey(this.getObjectKey(bucket, cleanPath));
    const host = this.getHost();
    const { amzDate, dateStamp } = formatAmzDates();
    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
    const ttl = Math.max(
      60,
      Math.min(MAX_S3_PRESIGN_TTL_SECONDS, Math.floor(expiresInSeconds))
    );

    const queryPairs: Array<[string, string]> = [
      ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
      ["X-Amz-Credential", `${this.config.accessKeyId}/${credentialScope}`],
      ["X-Amz-Date", amzDate],
      ["X-Amz-Expires", String(ttl)],
      ["X-Amz-SignedHeaders", "host"],
    ];

    const canonicalQuery = queryPairs
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${rfc3986Encode(k)}=${rfc3986Encode(v)}`)
      .join("&");

    const canonicalRequest = [
      method,
      `/${encodedKey}`,
      canonicalQuery,
      `host:${host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const signingKey = deriveSigV4SigningKey(
      this.config.secretAccessKey,
      dateStamp,
      this.config.region
    );
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    return {
      url: `https://${host}/${encodedKey}?${canonicalQuery}&X-Amz-Signature=${signature}`,
      signature,
      path: cleanPath,
    };
  }

  private signHeadersRequest(
    method: "PUT" | "DELETE",
    encodedKey: string,
    payloadHash: string,
    contentType?: string
  ): { url: string; headers: Record<string, string> } {
    const host = this.getHost();
    const { amzDate, dateStamp } = formatAmzDates();
    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;

    const headersMap = new Map<string, string>([
      ["host", host],
      ["x-amz-content-sha256", payloadHash],
      ["x-amz-date", amzDate],
    ]);
    if (contentType) {
      headersMap.set("content-type", contentType);
    }

    const sortedKeys = Array.from(headersMap.keys()).sort();
    const canonicalHeaders = sortedKeys
      .map((k) => `${k}:${headersMap.get(k)}\n`)
      .join("");
    const signedHeaders = sortedKeys.join(";");

    const canonicalRequest = [
      method,
      `/${encodedKey}`,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const signingKey = deriveSigV4SigningKey(
      this.config.secretAccessKey,
      dateStamp,
      this.config.region
    );
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const outHeaders: Record<string, string> = {
      Authorization: authorization,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
    };
    if (contentType) {
      outHeaders["Content-Type"] = contentType;
    }

    return {
      url: `https://${host}/${encodedKey}`,
      headers: outHeaders,
    };
  }

  async createSignedUploadUrl(
    bucket: StorageBucket,
    objectPath: string
  ): Promise<SignedUploadResult> {
    const signed = this.signPresignedUrl(
      "PUT",
      bucket,
      objectPath,
      SIGNED_UPLOAD_TTL_SECONDS
    );
    return {
      uploadUrl: signed.url,
      token: signed.signature,
      path: signed.path,
      expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
    };
  }

  getPublicUrl(bucket: StorageBucket, objectPath: string): string {
    const encodedKey = encodeS3ObjectKey(this.getObjectKey(bucket, objectPath));
    if (this.config.publicBaseUrl) {
      const base = this.config.publicBaseUrl.replace(/\/+$/, "");
      return `${base}/${encodedKey}`;
    }
    return `https://${this.getHost()}/${encodedKey}`;
  }

  async createSignedReadUrl(
    bucket: StorageBucket,
    objectPath: string,
    expiresInSeconds = DEFAULT_SIGNED_READ_TTL_SECONDS
  ): Promise<string> {
    return this.signPresignedUrl("GET", bucket, objectPath, expiresInSeconds)
      .url;
  }

  async uploadBuffer(
    bucket: StorageBucket,
    objectPath: string,
    body: Uint8Array | ArrayBuffer | Buffer,
    contentType: string
  ): Promise<{ path: string }> {
    const cleanPath = normalizeObjectPath(objectPath);
    const encodedKey = encodeS3ObjectKey(this.getObjectKey(bucket, cleanPath));
    const buffer = toNodeBuffer(body);
    const payloadHash = sha256Hex(buffer);
    const signed = this.signHeadersRequest(
      "PUT",
      encodedKey,
      payloadHash,
      contentType
    );

    const response = await fetch(signed.url, {
      method: "PUT",
      headers: signed.headers,
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new ExternalServiceError(
        `Unable to upload object to S3 bucket (${response.status}).`,
        "EXTERNAL_SERVICE_ERROR"
      );
    }

    return { path: cleanPath };
  }

  async deleteObject(
    bucket: StorageBucket,
    objectPaths: string | string[]
  ): Promise<void> {
    const paths = (Array.isArray(objectPaths) ? objectPaths : [objectPaths])
      .map(normalizeObjectPath)
      .filter((p) => p.length > 0);

    if (paths.length === 0) return;

    const emptyHash = sha256Hex("");
    await Promise.all(
      paths.map(async (cleanPath) => {
        const encodedKey = encodeS3ObjectKey(
          this.getObjectKey(bucket, cleanPath)
        );
        const signed = this.signHeadersRequest("DELETE", encodedKey, emptyHash);
        const response = await fetch(signed.url, {
          method: "DELETE",
          headers: signed.headers,
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok && response.status !== 404) {
          throw new ExternalServiceError(
            `Unable to delete S3 object (${response.status}).`,
            "EXTERNAL_SERVICE_ERROR"
          );
        }
      })
    );
  }
}

/**
 * Returns the active configured storage backend (`supabase` or `s3` in `ca-central-1`).
 */
export function getStorageAdapter(): StorageAdapter {
  const env = getServerEnv();
  if (env.storageDriver === "s3") {
    return new S3StorageAdapter(resolveS3StorageConfig(env));
  }

  return new SupabaseStorageAdapter();
}
