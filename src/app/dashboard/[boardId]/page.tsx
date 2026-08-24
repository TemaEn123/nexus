import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getBoard, NotFoundError } from "@/features/board/service";
import { requireUser } from "@/server/require-user";

/**
 * Заглушка доски. Колонки не рисуем — канбан в шаге 2.2.
 * `cache`: generateMetadata и page не ходят в Prisma дважды за запрос.
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
}: PageProps<"/dashboard/[boardId]">) {
  const { boardId } = await params;
  const board = await loadBoard(boardId);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <Link
        className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
        href="/dashboard"
      >
        Back to dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{board.title}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Kanban — step 2.2
        </p>
      </div>
    </main>
  );
}
