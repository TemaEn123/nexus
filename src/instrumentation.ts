import * as Sentry from "@sentry/nextjs";

/**
 * Next.js: `src/instrumentation.ts`. Без `onRequestError` часть ошибок RSC не уйдёт.
 * `proxy.ts` в Next 16 — Node; edge-конфиг на случай другого edge-рантайма.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
