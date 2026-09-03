"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CreateColumnForm } from "@/features/board/create-column-form";
import { boardFormError } from "@/features/board/form-error";
import type { BoardCard, BoardColumn } from "@/features/board/types";
import { useBoardQuery } from "@/features/board/use-board-query";
import { useMoveCardMutation } from "@/features/board/use-move-card";
import { ApiClientError } from "@/shared/api/http";
import { boardKeys } from "@/shared/api/query-keys";
import { KanbanColumn } from "./kanban-column";
import { kanbanPlugins, kanbanSensors } from "./kanban-dnd";

const errorClass =
  "shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/**
 * Канбан: колонки из Query (hydrate с RSC). Форма новой колонки справа.
 * Горизонтальный скролл на любой ширине (не стопка). Карточки — overflow-y внутри колонки.
 * Порядок во время drag — только локальный state; Query в UI не пишем, пока жест живой.
 * Persist: snapshot vs текущий список (`cardLocation`), не `initialGroup`.
 */
export function KanbanBoard({ boardId }: { boardId: string }) {
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: board,
    isError,
    isPending,
  } = useBoardQuery(boardId, draggingRef);
  const moveCard = useMoveCardMutation(boardId);
  const serverColumns = board?.columns ?? [];
  const [columns, setColumns] = useState(serverColumns);
  const [moveError, setMoveError] = useState<string>();
  const columnsRef = useRef(columns);
  const snapshotRef = useRef(serverColumns);

  columnsRef.current = columns;

  const [plugins] = useState(() => kanbanPlugins(() => columnsRef.current));

  function finishDrag(restore?: BoardColumn[]) {
    draggingRef.current = false;
    if (restore) {
      setColumns(restore);
    }
    setDragging(false);
  }

  const serverKey = orderKey(serverColumns);

  useEffect(() => {
    if (dragging) {
      return;
    }

    setColumns((current) =>
      orderKey(current) === serverKey ? current : serverColumns,
    );
  }, [dragging, serverColumns, serverKey]);

  if (!board) {
    if (isError) {
      return <p className={errorClass}>Something went wrong. Try again.</p>;
    }

    if (isPending) {
      return <KanbanPending />;
    }

    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {moveError ? <p className={errorClass}>{moveError}</p> : null}
      <DragDropProvider
        plugins={plugins}
        sensors={kanbanSensors}
        onDragEnd={async (event) => {
          if (event.canceled) {
            finishDrag(snapshotRef.current);
            return;
          }

          const cardId = event.operation.source?.id;
          if (typeof cardId !== "string") {
            finishDrag(snapshotRef.current);
            return;
          }

          const from = cardLocation(snapshotRef.current, cardId);
          const to = cardLocation(columnsRef.current, cardId);
          if (!from || !to) {
            finishDrag(snapshotRef.current);
            return;
          }

          if (from.columnId === to.columnId && from.index === to.index) {
            finishDrag();
            return;
          }

          try {
            await moveCard.mutateAsync({
              cardId,
              columnId: to.columnId,
              position: to.index,
              columns: columnsRef.current,
            });
            finishDrag();
          } catch (error) {
            finishDrag(snapshotRef.current);
            setMoveError(
              error instanceof ApiClientError && error.code === "conflict"
                ? boardFormError("conflict")
                : "Something went wrong. Try again.",
            );
          }
        }}
        onDragOver={(event) => {
          setColumns((current) =>
            withMovedCards(current, move(cardsByColumn(current), event)),
          );
        }}
        onDragStart={() => {
          draggingRef.current = true;
          setDragging(true);
          snapshotRef.current = columnsRef.current;
          setMoveError(undefined);
          void queryClient.cancelQueries({
            queryKey: boardKeys.detail(boardId),
          });
        }}
      >
        <div className="flex min-h-0 flex-1 flex-nowrap items-stretch gap-4 overflow-x-auto overflow-y-hidden pb-2">
          {columns.map((column) => (
            <KanbanColumn boardId={boardId} column={column} key={column.id} />
          ))}
          <CreateColumnForm boardId={boardId} />
        </div>
      </DragDropProvider>
    </div>
  );
}

function KanbanPending() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-nowrap gap-4 overflow-x-auto overflow-y-hidden pb-2"
    >
      <span className="sr-only">Loading</span>
      {["a", "b", "c"].map((key) => (
        <div
          className="h-full min-h-64 w-72 shrink-0 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          key={key}
        />
      ))}
    </div>
  );
}

function orderKey(columns: BoardColumn[]) {
  return columns
    .map(
      (column) =>
        `${column.id}:${column.cards.map((card) => card.id).join(",")}`,
    )
    .join("|");
}

function cardLocation(columns: BoardColumn[], cardId: string) {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) {
      return { columnId: column.id, index };
    }
  }

  return undefined;
}

function cardsByColumn(columns: BoardColumn[]): Record<string, BoardCard[]> {
  const cards: Record<string, BoardCard[]> = {};

  for (const column of columns) {
    cards[column.id] = column.cards;
  }

  return cards;
}

function withMovedCards(
  columns: BoardColumn[],
  cards: Record<string, BoardCard[]>,
): BoardColumn[] {
  return columns.map((column) => ({
    ...column,
    cards: cards[column.id] ?? [],
  }));
}
