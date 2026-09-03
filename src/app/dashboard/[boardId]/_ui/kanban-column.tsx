"use client";

import { useDroppable } from "@dnd-kit/react";
import { useState } from "react";
import { ConfirmSubmit } from "@/features/board/confirm-submit";
import { CreateCardForm } from "@/features/board/create-card-form";
import { mutationFormError } from "@/features/board/form-error";
import { isTempId } from "@/features/board/temp-id";
import type { BoardColumn } from "@/features/board/types";
import { useDeleteColumnMutation } from "@/features/board/use-board-mutations";
import { KanbanCard } from "./kanban-card";

const deleteButtonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";
const errorClass = "mt-1 text-xs text-red-800 dark:text-red-200";

export function KanbanColumn({
  boardId,
  column,
}: {
  boardId: string;
  column: BoardColumn;
}) {
  const isTemp = isTempId(column.id);
  const deleteColumn = useDeleteColumnMutation(boardId);
  const [error, setError] = useState<string>();
  const { isDropTarget, ref } = useDroppable({
    id: column.id,
    accept: "item",
    type: "column",
    // CollisionPriority.Low: карточка в колонке важнее самой колонки.
    collisionPriority: 1,
    data: { title: column.title },
    disabled: isTemp,
  });

  return (
    <section className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 py-3">
        <h2 className="min-w-0 text-sm font-medium">{column.title}</h2>
        {isTemp ? null : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError(undefined);
              deleteColumn.mutate(
                { columnId: column.id },
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
              confirmMessage="Delete this column and its cards?"
              idleLabel="Delete"
              pending={deleteColumn.isPending}
              pendingLabel="Deleting…"
            />
          </form>
        )}
      </div>
      {error ? <p className={`${errorClass} px-4`}>{error}</p> : null}
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${isDropTarget ? "bg-zinc-100 dark:bg-zinc-900" : ""}`}
        ref={ref}
      >
        <ul className="flex min-h-24 flex-col gap-2 px-3 pb-3">
          {column.cards.length === 0 ? (
            <li className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No cards
            </li>
          ) : null}
          {column.cards.map((card, index) => (
            <KanbanCard
              boardId={boardId}
              card={card}
              columnId={column.id}
              index={index}
              key={card.id}
            />
          ))}
        </ul>
      </div>
      <div className="shrink-0">
        {isTemp ? null : (
          <CreateCardForm boardId={boardId} columnId={column.id} />
        )}
      </div>
    </section>
  );
}
