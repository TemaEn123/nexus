"use client";

import { RouteError } from "../_ui/route-error";

/**
 * Ошибка `page` / `_ui` dashboard. Layout (header) остаётся.
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} />;
}
