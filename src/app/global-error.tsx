"use client";

import { RouteError } from "./_ui/route-error";
import "./globals.css";

/**
 * Падение root layout: своих `html`/`body` нет, поэтому рисуем их здесь.
 * `globals.css` подключаем заново — root layout уже недоступен.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html className="h-full antialiased" lang="en">
      <body className="min-h-full flex flex-col">
        <title>Something went wrong</title>
        <RouteError error={error} homeHref="/" retry={retry} />
      </body>
    </html>
  );
}
