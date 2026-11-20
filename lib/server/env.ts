import { z } from "zod";

const publicSupabaseSchema = z.object({
  url: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL"),
  publishableKey: z
    .string()
    .min(
      1,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) is required"
    ),
});

const serverEnvSchema = z.object({
  supabaseUrl: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL"),
  supabasePublishableKey: z
    .string()
    .min(
      1,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) is required"
    ),
  supabaseSecretKey: z
    .string()
    .min(
      1,
      "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required on the server"
    ),
  appUrl: z.string().url().optional(),
  enableMockApi: z.boolean(),
  storageDriver: z.enum(["supabase", "s3"]),
  kycMode: z.enum(["sandbox", "manual", "provider"]),
  stripeSecretKey: z.string().min(1).optional(),
  stripeWebhookSecret: z.string().min(1).optional(),
  sendgridApiKey: z.string().min(1).optional(),
  resendApiKey: z.string().min(1).optional(),
  emailFrom: z.string().min(1).optional(),
  caslUnsubscribeSecret: z.string().min(1).optional(),
  twilioAccountSid: z.string().min(1).optional(),
  twilioAuthToken: z.string().min(1).optional(),
  twilioFromNumber: z.string().min(1).optional(),
  upstashRedisRestUrl: z.string().url().optional(),
  upstashRedisRestToken: z.string().min(1).optional(),
  awsRegion: z.string().min(1).optional(),
  awsS3Bucket: z.string().min(1).optional(),
  awsAccessKeyId: z.string().min(1).optional(),
  awsSecretAccessKey: z.string().min(1).optional(),
});

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedPublicEnv: PublicSupabaseEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function formatEnvIssues(prefix: string, issues: z.ZodIssue[]): Error {
  const details = issues
    .map((issue) => `${issue.path.map(String).join(".") || "env"}: ${issue.message}`)
    .join("; ");
  return new Error(`${prefix}: ${details}`);
}

/**
 * Validates and returns public Supabase client configuration lazily at runtime
 * so `next build` static analysis never crashes when env vars are omitted.
 */
export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  if (cachedPublicEnv) return cachedPublicEnv;

  const parsed = publicSupabaseSchema.safeParse({
    url: nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "",
    publishableKey:
      nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
      nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
      "",
  });

  if (!parsed.success) {
    throw formatEnvIssues(
      "Invalid public Supabase environment configuration",
      parsed.error.issues
    );
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

/**
 * Validates and returns server-only environment configuration lazily at runtime.
 * Throws immediately if called from browser/client context.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "getServerEnv() is strictly server-only and must never run in client code."
    );
  }

  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverEnvSchema.safeParse({
    supabaseUrl: nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "",
    supabasePublishableKey:
      nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
      nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
      "",
    supabaseSecretKey:
      nonEmpty(process.env.SUPABASE_SECRET_KEY) ??
      nonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
      "",
    appUrl: nonEmpty(process.env.NEXT_PUBLIC_APP_URL),
    enableMockApi: nonEmpty(process.env.ENABLE_MOCK_API) === "true",
    storageDriver: nonEmpty(process.env.STORAGE_DRIVER) ?? "supabase",
    kycMode: nonEmpty(process.env.KYC_MODE) ?? "sandbox",
    stripeSecretKey: nonEmpty(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: nonEmpty(process.env.STRIPE_WEBHOOK_SECRET),
    sendgridApiKey: nonEmpty(process.env.SENDGRID_API_KEY),
    resendApiKey: nonEmpty(process.env.RESEND_API_KEY),
    emailFrom: nonEmpty(process.env.EMAIL_FROM),
    caslUnsubscribeSecret: nonEmpty(process.env.CASL_UNSUBSCRIBE_SECRET),
    twilioAccountSid: nonEmpty(process.env.TWILIO_ACCOUNT_SID),
    twilioAuthToken: nonEmpty(process.env.TWILIO_AUTH_TOKEN),
    twilioFromNumber: nonEmpty(process.env.TWILIO_FROM_NUMBER),
    upstashRedisRestUrl: nonEmpty(process.env.UPSTASH_REDIS_REST_URL),
    upstashRedisRestToken: nonEmpty(process.env.UPSTASH_REDIS_REST_TOKEN),
    awsRegion: nonEmpty(process.env.AWS_REGION),
    awsS3Bucket: nonEmpty(process.env.AWS_S3_BUCKET),
    awsAccessKeyId: nonEmpty(process.env.AWS_ACCESS_KEY_ID),
    awsSecretAccessKey: nonEmpty(process.env.AWS_SECRET_ACCESS_KEY),
  });

  if (!parsed.success) {
    throw formatEnvIssues(
      "Invalid server environment configuration",
      parsed.error.issues
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
