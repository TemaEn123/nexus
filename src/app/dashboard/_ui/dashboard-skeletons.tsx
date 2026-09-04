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

/** Канбан `/dashboard/[boardId]`: три колонки, не список досок. */
export function BoardPageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 px-4 py-6"
    >
      <span className="sr-only">Loading</span>
      <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <BoardTitleSkeleton />
      <ColumnsSkeleton />
    </main>
  );
}

export function BoardTitleSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="h-8 w-48 shrink-0 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Три колонки `w-72`: `loading.tsx` (через BoardPageSkeleton),
 * Suspense на странице доски, Query pending в KanbanBoard.
 */
export function ColumnsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-nowrap gap-4 overflow-x-auto overflow-y-hidden pb-2"
    >
      <span className="sr-only">Loading</span>
      {["a", "b", "c"].map((key) => (
        <div
          className="h-full min-h-64 w-72 shrink-0 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          key={key}
        />
      ))}
    </div>
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
