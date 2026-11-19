type LogLevel = "info" | "warn" | "error";

export type LogContext = {
  requestId?: string;
  route?: string;
  actorId?: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

const SENSITIVE_KEY_PATTERN =
  /^(password|token|secret|authorization|cookie|apikey|api_key|creditcard|credit_card|access_token|refresh_token|service_role)$/i;

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || value === undefined) return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key) || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password")) {
        clean[key] = "[REDACTED]";
      } else {
        clean[key] = redactValue(entry, depth + 1);
      }
    }
    return clean;
  }

  return value;
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context.requestId ? { requestId: context.requestId } : {}),
    ...(context.route ? { route: context.route } : {}),
    ...(context.actorId ? { actorId: context.actorId } : {}),
    ...(context.durationMs !== undefined ? { durationMs: context.durationMs } : {}),
    ...(context.meta ? { meta: redactValue(context.meta) } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

/**
 * Structured single-line JSON server logger with automatic secret/PII redaction.
 */
export const logger = {
  info(message: string, context?: LogContext): void {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    writeLog("error", message, context);
  },
};
