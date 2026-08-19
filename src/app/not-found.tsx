import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
};

/**
 * Корневой 404: unmatched URL и `notFound()`.
 * Сессию не читаем — иначе 404 сам ходит в cookie.
 * Ссылка на `/dashboard`: proxy отправит анонима на `/login`.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This page does not exist.
        </p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <Link
          className="rounded-lg bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          href="/"
        >
          Home
        </Link>
        <Link
          className="text-zinc-600 underline hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          href="/dashboard"
        >
          Dashboard
        </Link>
      </nav>
    </main>
  );
}
