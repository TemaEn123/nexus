import { deleteCardAction } from "@/features/board/actions";
import { ConfirmSubmit } from "@/features/board/confirm-submit";
import type { BoardCard } from "./board-types";

const deleteButtonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

export function KanbanCard({
  boardId,
  card,
}: {
  boardId: string;
  card: BoardCard;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-medium">{card.title}</h3>
        <form action={deleteCardAction}>
          <input name="boardId" type="hidden" value={boardId} />
          <input name="cardId" type="hidden" value={card.id} />
          <ConfirmSubmit
            className={deleteButtonClass}
            confirmMessage="Delete this card?"
            idleLabel="Delete"
            pendingLabel="Deleting…"
          />
        </form>
      </div>
      {card.description ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
          {card.description}
        </p>
      ) : null}
    </article>
  );
}
