import { deleteColumnAction } from "@/features/board/actions";
import { ConfirmSubmit } from "@/features/board/confirm-submit";
import { CreateCardForm } from "@/features/board/create-card-form";
import type { BoardColumn } from "./board-types";
import { KanbanCard } from "./kanban-card";

const deleteButtonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

export function KanbanColumn({
  boardId,
  column,
}: {
  boardId: string;
  column: BoardColumn;
}) {
  return (
    <section className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 py-3">
        <h2 className="min-w-0 text-sm font-medium">{column.title}</h2>
        <form action={deleteColumnAction}>
          <input name="boardId" type="hidden" value={boardId} />
          <input name="columnId" type="hidden" value={column.id} />
          <ConfirmSubmit
            className={deleteButtonClass}
            confirmMessage="Delete this column and its cards?"
            idleLabel="Delete"
            pendingLabel="Deleting…"
          />
        </form>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {column.cards.length === 0 ? (
          <p className="px-4 pb-3 text-sm text-zinc-500 dark:text-zinc-400">
            No cards
          </p>
        ) : (
          <ul className="flex flex-col gap-2 px-3 pb-3">
            {column.cards.map((card) => (
              <li key={card.id}>
                <KanbanCard boardId={boardId} card={card} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0">
        <CreateCardForm boardId={boardId} columnId={column.id} />
      </div>
    </section>
  );
}
