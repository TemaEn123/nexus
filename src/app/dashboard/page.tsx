import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateBoardForm } from "@/features/board/create-board-form";
import { BoardList } from "./_ui/board-list";
import { CreateBoardError } from "./_ui/create-board-error";
import { BoardsSkeleton } from "./_ui/dashboard-skeletons";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Protected dashboard: доски, не профиль (имя в UserMenu).
 * Page не await'ит сессию и searchParams — заголовок и форма сразу.
 * `requireUser` внутри BoardList / UserMenu (`cache()`, шаг 2).
 * `?error=` — CreateBoardError в Suspense.
 */
export default function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="flex flex-col gap-4">
        <Suspense fallback={null}>
          <CreateBoardError searchParams={searchParams} />
        </Suspense>
        <CreateBoardForm />
      </div>

      <Suspense fallback={<BoardsSkeleton />}>
        <BoardList />
      </Suspense>
    </main>
  );
}
