"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useEffect, useRef, useState } from "react";
import { moveCardAction } from "@/features/board/actions";
import { CreateColumnForm } from "@/features/board/create-column-form";
import { boardFormError } from "@/features/board/form-error";
import type { BoardCard, BoardColumn } from "./board-types";
import { KanbanColumn } from "./kanban-column";
import { kanbanPlugins, kanbanSensors } from "./kanban-dnd";

const errorClass =
  "shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/**
 * Канбан: колонки из `getBoard` + форма новой колонки справа.
 * Горизонтальный скролл на любой ширине (не стопка). Карточки — overflow-y внутри колонки.
 * Порядок во время drag — локальный state; persist — `moveCardAction`, без redirect.
 * После drop RSC-пропсы синкаются по порядку id, не во время drag.
 * Persist: snapshot vs текущий список — `initialGroup` после смены колонки сбрасывается.
 */
export function KanbanBoard({
  boardId,
  columns: serverColumns,
}: {
  boardId: string;
  columns: BoardColumn[];
}) {
  const [columns, setColumns] = useState(serverColumns);
  const [moveError, setMoveError] = useState<string>();
  const columnsRef = useRef(columns);
  const snapshotRef = useRef(serverColumns);
  const draggingRef = useRef(false);
  const pendingServerRef = useRef<BoardColumn[] | null>(null);

  columnsRef.current = columns;

  const [plugins] = useState(() => kanbanPlugins(() => columnsRef.current));

  function finishDrag(restore?: BoardColumn[]) {
    draggingRef.current = false;
    const pending = pendingServerRef.current;
    pendingServerRef.current = null;

    if (pending) {
      setColumns((current) =>
        orderKey(current) === orderKey(pending) ? current : pending,
      );
      return;
    }

    if (restore) {
      setColumns(restore);
    }
  }

  const serverKey = orderKey(serverColumns);

  useEffect(() => {
    if (draggingRef.current) {
      pendingServerRef.current = serverColumns;
      return;
    }

    pendingServerRef.current = null;
    setColumns((current) =>
      orderKey(current) === serverKey ? current : serverColumns,
    );
  }, [serverColumns, serverKey]);

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

          const result = await moveCardAction({
            cardId,
            boardId,
            columnId: to.columnId,
            position: to.index,
          });

          if (!result.ok) {
            finishDrag(snapshotRef.current);
            setMoveError(
              result.error === "conflict"
                ? boardFormError("conflict")
                : "Something went wrong. Try again.",
            );
            return;
          }

          finishDrag();
        }}
        onDragOver={(event) => {
          setColumns((current) =>
            withMovedCards(current, move(cardsByColumn(current), event)),
          );
        }}
        onDragStart={() => {
          draggingRef.current = true;
          snapshotRef.current = columnsRef.current;
          setMoveError(undefined);
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
