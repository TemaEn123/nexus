"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { CreateColumnForm } from "@/features/board/create-column-form";
import { boardFormError } from "@/features/board/form-error";
import type { BoardCard, BoardColumn } from "@/features/board/types";
import {
  BoardOptimisticProvider,
  useBoardOptimistic,
} from "@/features/board/use-board-optimistic";
import { useBoardQuery } from "@/features/board/use-board-query";
import { useMoveCardMutation } from "@/features/board/use-move-card";
import { ApiClientError } from "@/shared/api/http";
import { boardKeys } from "@/shared/api/query-keys";
import { ColumnsSkeleton } from "../../_ui/dashboard-skeletons";
import { KanbanColumn } from "./kanban-column";
import { kanbanPlugins, kanbanSensors } from "./kanban-dnd";

const errorClass =
  "shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/**
 * Канбан: колонки из Query (hydrate с RSC). Форма новой колонки справа.
 * Горизонтальный скролл на любой ширине (не стопка). Карточки — overflow-y внутри колонки.
 * Карточки CUD — `useOptimistic` поверх Query; список вне drag оттуда же,
 * без копии в useState (иначе эффект + новый массив с каждого render → цикл).
 * Порядок во время drag — локальный state; Query в UI не пишем, пока жест живой.
 * Persist: snapshot vs текущий список (`cardLocation`), не `initialGroup`.
 */
export function KanbanBoard({ boardId }: { boardId: string }) {
  const draggingRef = useRef(false);
  const queryClient = useQueryClient();
  const {
    data: board,
    isError,
    isPending,
  } = useBoardQuery(boardId, draggingRef);
  const [optimisticBoard, applyOptimistic] = useBoardOptimistic(board);
  const moveCard = useMoveCardMutation(boardId);
  const sourceColumns = optimisticBoard?.columns ?? [];
  const [dragColumns, setDragColumns] = useState<BoardColumn[] | null>(null);
  const [moveError, setMoveError] = useState<string>();
  const columns = dragColumns ?? sourceColumns;
  const columnsRef = useRef(columns);
  const snapshotRef = useRef(sourceColumns);

  columnsRef.current = columns;

  // dnd-kit сравнивает plugins по ссылке. Один экземпляр на жизнь доски;
  // не useMemo — initializer и так один раз, компилятор чужой === не видит.
  const [plugins] = useState(() => kanbanPlugins(() => columnsRef.current));

  function finishDrag() {
    draggingRef.current = false;
    setDragColumns(null);
  }

  if (!board) {
    if (isError) {
      return <p className={errorClass}>Something went wrong. Try again.</p>;
    }

    if (isPending) {
      return <ColumnsSkeleton />;
    }

    return null;
  }

  return (
    <BoardOptimisticProvider apply={applyOptimistic}>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {moveError ? <p className={errorClass}>{moveError}</p> : null}
        <DragDropProvider
          plugins={plugins}
          sensors={kanbanSensors}
          onDragEnd={async (event) => {
            if (event.canceled) {
              finishDrag();
              return;
            }

            const cardId = event.operation.source?.id;
            if (typeof cardId !== "string") {
              finishDrag();
              return;
            }

            const from = cardLocation(snapshotRef.current, cardId);
            const to = cardLocation(columnsRef.current, cardId);
            if (!from || !to) {
              finishDrag();
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
              finishDrag();
              setMoveError(
                error instanceof ApiClientError && error.code === "conflict"
                  ? boardFormError("conflict")
                  : "Something went wrong. Try again.",
              );
            }
          }}
          onDragOver={(event) => {
            setDragColumns((current) => {
              const base = current ?? sourceColumns;
              return withMovedCards(base, move(cardsByColumn(base), event));
            });
          }}
          onDragStart={() => {
            draggingRef.current = true;
            snapshotRef.current = columnsRef.current;
            setDragColumns(columnsRef.current);
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
    </BoardOptimisticProvider>
  );
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
