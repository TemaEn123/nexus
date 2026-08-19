"use client";

import Link from "next/link";
import { useEffect } from "react";

const secondaryButtonClass =
  "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";
const primaryButtonClass =
  "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

type RouteErrorProps = {
  error: unknown;
  retry: () => void;
  homeHref?: "/";
};

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

function digestOf(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return undefined;
  }

  const { digest } = error;
  return typeof digest === "string" ? digest : undefined;
}

/**
 * Общая разметка для `error.tsx` / `global-error.tsx`.
 * Next 16.3 передаёт `retry` (refresh RSC + сброс boundary), не `reset`.
 */
export function RouteError({ error, retry, homeHref }: RouteErrorProps) {
  const isDev = process.env.NODE_ENV === "development";
  const message = messageOf(error);
  const digest = digestOf(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {isDev && message
            ? message
            : "Try again. If it keeps happening, come back later."}
        </p>
        {!isDev && digest ? (
          <p className="mt-2 font-mono text-xs text-zinc-500">{digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
        <button className={primaryButtonClass} onClick={retry} type="button">
          Try again
        </button>
        {homeHref ? (
          <Link className={secondaryButtonClass} href={homeHref}>
            Home
          </Link>
        ) : null}
      </div>
    </main>
  );
}
