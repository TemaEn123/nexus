"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

const secondaryButtonClass =
  "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";
const primaryButtonClass =
  "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

type RouteErrorScope = "root" | "dashboard" | "global";

type RouteErrorProps = {
  error: unknown;
  retry: () => void;
  scope: RouteErrorScope;
};

const COPY: Record<
  RouteErrorScope,
  {
    title: string;
    description: string;
    href?: "/" | "/dashboard";
    label?: string;
  }
> = {
  root: {
    title: "We could not load this page",
    description: "Try again. If it keeps happening, go back home.",
    href: "/",
    label: "Home",
  },
  dashboard: {
    title: "We could not load this view",
    description: "Try again. Your boards are still available.",
    href: "/dashboard",
    label: "Dashboard",
  },
  global: {
    title: "Something went wrong",
    description: "Try again. If it keeps happening, come back later.",
    href: "/",
    label: "Home",
  },
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
 * Сюда же `captureException`: `global-error` тоже рендерит `RouteError`.
 * `scope` выбирает текст и запасной переход, не стек и не API-ошибку.
 */
export function RouteError({ error, retry, scope }: RouteErrorProps) {
  const isDev = process.env.NODE_ENV === "development";
  const message = messageOf(error);
  const digest = digestOf(error);
  const copy = COPY[scope];

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <section
        className="w-full rounded-xl border border-zinc-200 px-6 py-10 dark:border-zinc-800"
        role="alert"
      >
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {isDev && message ? message : copy.description}
        </p>
        {!isDev && digest ? (
          <p className="mt-3 font-mono text-xs text-zinc-500">
            Reference {digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <button className={primaryButtonClass} onClick={retry} type="button">
            Try again
          </button>
          {copy.href && copy.label ? (
            <Link className={secondaryButtonClass} href={copy.href}>
              {copy.label}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
