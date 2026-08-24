import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateBoardForm } from "@/features/board/create-board-form";
import { boardFormError } from "@/features/board/form-error";
import { requireUser } from "@/server/require-user";
import { BoardList } from "./_ui/board-list";
import { BoardsSkeleton } from "./_ui/dashboard-skeletons";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Protected dashboard: доски, не профиль (имя в UserMenu).
 * `requireUser()` — второй слой после proxy.
 * Список в Suspense, форма create — сразу.
 * `searchParams` — Promise; `error` ставит createBoardAction через redirect.
 */
export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireUser();
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <CreateBoardForm error={boardFormError(params.error)} />

      <Suspense fallback={<BoardsSkeleton />}>
        <BoardList userId={user.id} />
      </Suspense>
    </main>
  );
}
