import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { boardFormError } from "@/features/board/form-error";
import { getBoard, NotFoundError } from "@/features/board/service";
import { requireUser } from "@/server/require-user";
import { KanbanBoard } from "./_ui/kanban-board";

/**
 * Доска с канбаном. `cache`: generateMetadata и page не ходят в Prisma дважды.
 * Чужой или нет id → `notFound()` (тот же 404, что у API), не 403.
 */
const loadBoard = cache(async (boardId: string) => {
  const user = await requireUser();

  try {
    return await getBoard(user.id, boardId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
});

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[boardId]">): Promise<Metadata> {
  const { boardId } = await params;
  const board = await loadBoard(boardId);

  return { title: board.title };
}

export default async function BoardPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[boardId]">) {
  const { boardId } = await params;
  const board = await loadBoard(boardId);
  const query = await searchParams;
  const formError = boardFormError(query.error);

  return (
    <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 px-4 py-6">
      <Link
        className="shrink-0 text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
        href="/dashboard"
      >
        Back to dashboard
      </Link>
      <h1 className="shrink-0 text-2xl font-semibold tracking-tight">
        {board.title}
      </h1>
      {formError ? (
        <p className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {formError}
        </p>
      ) : null}
      <KanbanBoard boardId={board.id} columns={board.columns} />
    </main>
  );
}
