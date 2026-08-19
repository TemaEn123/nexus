import { listBoards } from "@/features/board/service";

/**
 * Read-only preview. Create/delete и маршрут доски — М2.
 * Список названий, не ссылки: `/dashboard/[boardId]` ещё нет.
 */
export async function BoardsPreview({ userId }: { userId: string }) {
  const boards = await listBoards(userId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-500">Boards</h2>
      {boards.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          No boards yet
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {boards.map((board) => (
            <li
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800"
              key={board.id}
            >
              {board.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
