import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/server/require-user";
import { BoardsPreview } from "./_ui/boards-preview";
import { BoardsSkeleton } from "./_ui/dashboard-skeletons";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Protected dashboard (RSC). Канбан будет в М2.
 * `requireUser()` — второй слой после proxy; Sign out в layout.
 * Доски в отдельном Suspense: профиль не ждёт Prisma.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const displayName = user.name ?? user.email ?? "Account";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Signed in as {displayName}
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 text-sm dark:border-zinc-800">
        {user.name ? (
          <div>
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
        ) : null}
        {user.email ? (
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        ) : null}
      </dl>

      <Suspense fallback={<BoardsSkeleton />}>
        <BoardsPreview userId={user.id} />
      </Suspense>
    </main>
  );
}
