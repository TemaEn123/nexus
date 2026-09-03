"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useState } from "react";
import { ConfirmSubmit } from "@/features/board/confirm-submit";
import { mutationFormError } from "@/features/board/form-error";
import { isTempId } from "@/features/board/temp-id";
import type { BoardCard } from "@/features/board/types";
import { useDeleteCardMutation } from "@/features/board/use-board-mutations";

const deleteButtonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";
const cardClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950";
const errorClass = "mt-1 text-xs text-red-800 dark:text-red-200";

export function KanbanCard({
  boardId,
  card,
  columnId,
  index,
}: {
  boardId: string;
  card: BoardCard;
  columnId: string;
  index: number;
}) {
  const isTemp = isTempId(card.id);
  const deleteCard = useDeleteCardMutation(boardId);
  const [error, setError] = useState<string>();
  const { isDragging, ref } = useSortable({
    id: card.id,
    index,
    group: columnId,
    type: "item",
    accept: "item",
    data: { title: card.title },
    disabled: isTemp,
  });

  return (
    <li ref={ref}>
      <article
        className={`${cardClass} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : isTemp ? "" : "cursor-grab"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-sm font-medium">{card.title}</h3>
          {isTemp ? null : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError(undefined);
                deleteCard.mutate(
                  { cardId: card.id },
                  {
                    onError: (cause) => {
                      setError(mutationFormError(cause));
                    },
                  },
                );
              }}
            >
              <ConfirmSubmit
                className={deleteButtonClass}
                confirmMessage="Delete this card?"
                idleLabel="Delete"
                pending={deleteCard.isPending}
                pendingLabel="Deleting…"
              />
            </form>
          )}
        </div>
        {card.description ? (
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
            {card.description}
          </p>
        ) : null}
        {error ? <p className={errorClass}>{error}</p> : null}
      </article>
    </li>
  );
}
