import Link from "next/link";

/** Публичная витрина вместо шаблона create-next-app. Канбан — в М2. */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Nexus</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Kanban board</p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <Link
          className="rounded-lg bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          href="/login"
        >
          Log in
        </Link>
        <Link
          className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href="/register"
        >
          Register
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
