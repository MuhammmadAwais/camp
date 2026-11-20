import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/server/env";
import { RateLimitError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";

export const RATE_LIMIT_POLICIES = {
  auth_login: {
    limit: 10,
    windowMs: 15 * 60 * 1000,
    label: "login attempts",
  },
  auth_register: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    label: "registration attempts",
  },
  auth_verify: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    label: "verification attempts",
  },
  auth_password_forgot: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    label: "password reset requests",
  },
  dealer_bid: {
    limit: 30,
    windowMs: 60 * 1000,
    label: "bid submissions",
  },
  vin_decode: {
    limit: 20,
    windowMs: 60 * 1000,
    label: "VIN decode requests",
  },
  privacy_export: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    label: "data export requests",
  },
  privacy_delete: {
    limit: 3,
    windowMs: 15 * 60 * 1000,
    label: "account deletion requests",
  },
} as const;

export type RateLimitPolicyKey = keyof typeof RATE_LIMIT_POLICIES;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAtUnixSec: number;
  backend: "upstash" | "memory";
};

type UpstashPipelineEntry = {
  result?: unknown;
  error?: string;
};

const MAX_MEMORY_KEYS = 10_000;
const KEY_PREFIX = "autonexa:rl";

const globalForRateLimit = globalThis as typeof globalThis & {
  __autonexaRateLimitStore?: Map<string, number[]>;
};

function getMemoryStore(): Map<string, number[]> {
  if (!globalForRateLimit.__autonexaRateLimitStore) {
    globalForRateLimit.__autonexaRateLimitStore = new Map<string, number[]>();
  }
  return globalForRateLimit.__autonexaRateLimitStore;
}

/**
 * Extracts and sanitizes the caller IP address from standard proxy headers.
 */
export function extractClientIp(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "127.0.0.1";

  const sanitized = raw.replace(/[^a-zA-Z0-9.:_-]/g, "").slice(0, 64);
  return sanitized || "127.0.0.1";
}

function checkMemoryRateLimit(
  policy: RateLimitPolicyKey,
  identifier: string,
  now: number
): RateLimitResult {
  const config = RATE_LIMIT_POLICIES[policy];
  const windowStart = now - config.windowMs;
  const namespacedKey = `${KEY_PREFIX}:${policy}:${identifier}`;
  const store = getMemoryStore();

  if (store.size > MAX_MEMORY_KEYS) {
    for (const [k, entries] of store.entries()) {
      const recent = entries.filter((ts) => ts > windowStart);
      if (recent.length === 0) {
        store.delete(k);
      } else {
        store.set(k, recent);
      }
    }
  }

  const existing = store.get(namespacedKey) ?? [];
  const active = existing.filter((ts) => ts > windowStart);

  if (active.length >= config.limit) {
    const oldest = active[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + config.windowMs - now) / 1000)
    );
    store.set(namespacedKey, active);
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      retryAfterSeconds,
      resetAtUnixSec: Math.ceil((oldest + config.windowMs) / 1000),
      backend: "memory",
    };
  }

  active.push(now);
  store.set(namespacedKey, active);
  const oldest = active[0] ?? now;
  const remaining = Math.max(0, config.limit - active.length);

  return {
    allowed: true,
    limit: config.limit,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil(config.windowMs / 1000)),
    resetAtUnixSec: Math.ceil((oldest + config.windowMs) / 1000),
    backend: "memory",
  };
}

async function runUpstashPipeline(
  baseUrl: string,
  token: string,
  commands: string[][]
): Promise<UpstashPipelineEntry[]> {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/pipeline`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(1500),
  });

  if (!response.ok) {
    throw new Error(`Upstash pipeline HTTP ${response.status}`);
  }

  const entries = (await response.json()) as UpstashPipelineEntry[];
  for (const entry of entries) {
    if (entry.error) {
      throw new Error(`Upstash Redis error: ${entry.error}`);
    }
  }
  return entries;
}

async function checkUpstashRateLimit(
  baseUrl: string,
  token: string,
  policy: RateLimitPolicyKey,
  identifier: string,
  now: number
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_POLICIES[policy];
  const windowStart = now - config.windowMs;
  const key = `${KEY_PREFIX}:${policy}:${identifier}`;

  const inspect = await runUpstashPipeline(baseUrl, token, [
    ["ZREMRANGEBYSCORE", key, "-inf", String(windowStart)],
    ["ZCARD", key],
    ["ZRANGE", key, "0", "0", "WITHSCORES"],
  ]);

  const count = Number(inspect[1]?.result ?? 0);
  const zrangeRaw = inspect[2]?.result;
  const oldestRaw =
    Array.isArray(zrangeRaw) && zrangeRaw.length >= 2
      ? Number(zrangeRaw[1])
      : NaN;
  const oldest = Number.isFinite(oldestRaw) ? oldestRaw : now;

  if (count >= config.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + config.windowMs - now) / 1000)
    );
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      retryAfterSeconds,
      resetAtUnixSec: Math.ceil((oldest + config.windowMs) / 1000),
      backend: "upstash",
    };
  }

  const member = `${now}:${crypto.randomUUID()}`;
  await runUpstashPipeline(baseUrl, token, [
    ["ZADD", key, String(now), member],
    ["PEXPIRE", key, String(config.windowMs)],
  ]);

  const remaining = Math.max(0, config.limit - (count + 1));
  return {
    allowed: true,
    limit: config.limit,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil(config.windowMs / 1000)),
    resetAtUnixSec: Math.ceil((oldest + config.windowMs) / 1000),
    backend: "upstash",
  };
}

/**
 * Evaluates a sliding-window rate limit using Upstash Redis in production when
 * configured, falling back automatically to an in-memory sliding-window store.
 */
export async function checkRateLimit(
  policy: RateLimitPolicyKey,
  identifier: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const env = getServerEnv();

  if (env.upstashRedisRestUrl && env.upstashRedisRestToken) {
    try {
      return await checkUpstashRateLimit(
        env.upstashRedisRestUrl,
        env.upstashRedisRestToken,
        policy,
        identifier,
        now
      );
    } catch (error) {
      logger.warn("Upstash rate-limit fallback to memory", {
        meta: { policy, error },
      });
    }
  }

  return checkMemoryRateLimit(policy, identifier, now);
}

/**
 * Enforces a route rate limit and throws `RateLimitError` (HTTP 429 `RATE_LIMITED`
 * with `Retry-After` header) when exceeded.
 */
export async function enforceRateLimit(
  request: NextRequest,
  policy: RateLimitPolicyKey,
  options?: { scopeKey?: string }
): Promise<RateLimitResult> {
  const ip = extractClientIp(request);
  const identifier = options?.scopeKey ? `${options.scopeKey}:${ip}` : ip;
  const result = await checkRateLimit(policy, identifier);

  if (!result.allowed) {
    const config = RATE_LIMIT_POLICIES[policy];
    throw new RateLimitError(
      `Too many ${config.label}. Please try again in ${result.retryAfterSeconds} seconds.`,
      result.retryAfterSeconds,
      "RATE_LIMITED"
    );
  }

  return result;
}

/**
 * Standard `X-RateLimit-*` informational response headers for allowed requests.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAtUnixSec),
  };
}
