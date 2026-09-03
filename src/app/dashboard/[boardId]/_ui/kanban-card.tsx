"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { useState } from "react";
import { DeleteCardForm } from "@/features/board/delete-card-form";
import { EditCardForm } from "@/features/board/edit-card-form";
import { isTempId } from "@/features/board/temp-id";
import type { BoardCard } from "@/features/board/types";

const cardClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950";
const editTitleClass =
  "min-w-0 flex-1 cursor-text rounded-sm text-left text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900";
const editDescriptionClass =
  "mt-1 w-full cursor-text whitespace-pre-wrap rounded-sm text-left text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900";

export function KanbanCard({
  boardId,
  card,
  columnId,
  index,
  onError,
}: {
  boardId: string;
  card: BoardCard;
  columnId: string;
  index: number;
  onError: (message: string | undefined) => void;
}) {
  const isTemp = isTempId(card.id);
  const [editing, setEditing] = useState(false);
  const { isDragging, ref } = useSortable({
    id: card.id,
    index,
    group: columnId,
    type: "item",
    accept: "item",
    data: { title: card.title },
    disabled: isTemp || editing,
  });

  return (
    <li ref={ref}>
      <article
        className={`${cardClass} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : isTemp || editing ? "" : "cursor-grab"}`}
      >
        {isTemp ? (
          <>
            <h3 className="min-w-0 text-sm font-medium">{card.title}</h3>
            {card.description ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                {card.description}
              </p>
            ) : null}
          </>
        ) : editing ? (
          <EditCardForm
            boardId={boardId}
            card={card}
            onClose={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <button
                className={editTitleClass}
                onClick={() => setEditing(true)}
                type="button"
              >
                {card.title}
              </button>
              <DeleteCardForm
                boardId={boardId}
                cardId={card.id}
                onError={onError}
              />
            </div>
            {card.description ? (
              <button
                className={editDescriptionClass}
                onClick={() => setEditing(true)}
                type="button"
              >
                {card.description}
              </button>
            ) : (
              <button
                className={`${editDescriptionClass} text-zinc-400 dark:text-zinc-500`}
                onClick={() => setEditing(true)}
                type="button"
              >
                Add description
              </button>
            )}
          </>
        )}
      </article>
    </li>
  );
}
