"use client";

import { RouteError } from "./_ui/route-error";

/**
 * Ловит throw в сегментах под root layout (`/`, login, register).
 * Свой layout не ловит — для этого `global-error.tsx`.
 */
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <RouteError error={error} homeHref="/" retry={retry} />;
}
