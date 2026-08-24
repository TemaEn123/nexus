export function UserMenuSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex items-center gap-3"
    >
      <span className="sr-only">Loading</span>
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-9 w-[5.75rem] animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

/** Заглушка `/dashboard/[boardId]`: заголовок, не список досок. */
export function BoardPageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16"
    >
      <span className="sr-only">Loading</span>
      <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-5 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}

export function BoardsSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col gap-3"
    >
      <span className="sr-only">Loading</span>
      <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex h-16 items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 dark:border-zinc-800">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex h-16 items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 dark:border-zinc-800">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </section>
  );
}
