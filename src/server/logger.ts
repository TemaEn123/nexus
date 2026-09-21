import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;
type LogContext = {
  requestId?: string;
  method?: string;
  path?: string;
  userId?: string;
};

const REDACTED = "[redacted]";
const CIRCULAR = "[circular]";
const SENSITIVE_KEY_PATTERN =
  /password|passphrase|authorization|cookie|token|secret|api[-_]?key/i;
const logContext = new AsyncLocalStorage<LogContext>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSensitiveKey(key: string) {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function serializeError(error: Error) {
  const code = (error as Error & { code?: unknown }).code;

  return {
    name: error.name,
    message: error.message,
    ...(typeof code === "string" || typeof code === "number" ? { code } : {}),
  };
}

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, seen));
  }

  if (!isRecord(value)) {
    return value;
  }

  if (seen.has(value)) {
    return CIRCULAR;
  }

  seen.add(value);

  const sanitized: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue === undefined) {
      continue;
    }

    sanitized[key] = isSensitiveKey(key)
      ? REDACTED
      : sanitize(fieldValue, seen);
  }

  seen.delete(value);

  return sanitized;
}

function writeLog(level: LogLevel, msg: string, fields: LogFields = {}) {
  const context = logContext.getStore() ?? {};
  const safeFields = sanitize(fields);
  const entry = {
    ...context,
    ...(isRecord(safeFields) ? safeFields : {}),
    level,
    msg,
    time: new Date().toISOString(),
  };

  console.log(JSON.stringify(entry));
}

export const logger = {
  info(msg: string, fields?: LogFields) {
    writeLog("info", msg, fields);
  },
  warn(msg: string, fields?: LogFields) {
    writeLog("warn", msg, fields);
  },
  error(msg: string, fields?: LogFields) {
    writeLog("error", msg, fields);
  },
};

export function requestIdFrom(request: Request) {
  const vercelId = request.headers.get("x-vercel-id")?.trim();
  if (vercelId) {
    return vercelId;
  }

  return crypto.randomUUID();
}

export function pathFromRequest(request: Request) {
  return new URL(request.url).pathname;
}

export function withLogContext<T>(context: LogContext, run: () => T) {
  return logContext.run(context, run);
}

export function setLogUserId(userId: string) {
  const context = logContext.getStore();
  if (context) {
    context.userId = userId;
  }
}
