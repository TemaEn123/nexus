import Link from "next/link";
import { deleteBoardAction } from "@/features/board/actions";
import { DeleteBoardButton } from "@/features/board/delete-board-button";
import { listBoards } from "@/features/board/service";
import { requireUser } from "@/server/require-user";

const deleteButtonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

/**
 * Список досок: ссылка на канбан, delete отдельной формой.
 * Сессия здесь, не в page — иначе форма Create ждёт auth.
 * Весь `<li>` не оборачиваем в Link — иначе Delete уйдёт на доску.
 */
export async function BoardList() {
  const user = await requireUser();
  const boards = await listBoards(user.id);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-500">Boards</h2>
      {boards.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          No boards yet
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {boards.map((board) => {
            const columnCount = board._count.columns;

            return (
              <li
                className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                key={board.id}
              >
                <Link
                  className="min-w-0 flex-1 hover:underline"
                  href={`/dashboard/${board.id}`}
                >
                  <span className="block truncate text-sm font-medium">
                    {board.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {columnCount} {columnCount === 1 ? "column" : "columns"}
                  </span>
                </Link>
                <form action={deleteBoardAction}>
                  <input name="boardId" type="hidden" value={board.id} />
                  <DeleteBoardButton className={deleteButtonClass} />
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
