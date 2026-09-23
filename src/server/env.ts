import "server-only";

import { z } from "zod";

/**
 * Серверные env в одном месте.
 * Production требует `DATABASE_URL` и `AUTH_SECRET`.
 * GitHub, AI и Sentry можно не задавать: OAuth просто не включится,
 * suggest ответит 503, сборка без Sentry-токена не падает.
 */

const serverEnvSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z.string().min(1).optional(),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
    SENTRY_DSN: z.string().min(1).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    SENTRY_URL: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && !env.AUTH_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET is required in production",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function trimmed(source: Record<string, string | undefined>, key: string) {
  const value = source[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const next = value.trim();
  return next.length > 0 ? next : undefined;
}

export function parseEnv(source: Record<string, string | undefined>) {
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    DATABASE_URL: trimmed(source, "DATABASE_URL") ?? "",
    AUTH_SECRET: trimmed(source, "AUTH_SECRET"),
    AUTH_GITHUB_ID: trimmed(source, "AUTH_GITHUB_ID"),
    AUTH_GITHUB_SECRET: trimmed(source, "AUTH_GITHUB_SECRET"),
    AI_GATEWAY_API_KEY: trimmed(source, "AI_GATEWAY_API_KEY"),
    NEXT_PUBLIC_APP_URL: trimmed(source, "NEXT_PUBLIC_APP_URL"),
    NEXT_PUBLIC_SENTRY_DSN: trimmed(source, "NEXT_PUBLIC_SENTRY_DSN"),
    SENTRY_DSN: trimmed(source, "SENTRY_DSN"),
    SENTRY_AUTH_TOKEN: trimmed(source, "SENTRY_AUTH_TOKEN"),
    SENTRY_ORG: trimmed(source, "SENTRY_ORG"),
    SENTRY_PROJECT: trimmed(source, "SENTRY_PROJECT"),
    SENTRY_URL: trimmed(source, "SENTRY_URL"),
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }

  return parsed.data;
}

let cached: ServerEnv | undefined;

export function getEnv() {
  cached ??= parseEnv(process.env);
  return cached;
}
