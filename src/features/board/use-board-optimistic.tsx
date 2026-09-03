"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useOptimistic,
} from "react";
import type { BoardCard, BoardDetail } from "@/features/board/types";

/**
 * Overlay поверх Query: add / patch / remove карточки до ответа Server Action.
 * `apply` только внутри transition (`form action` или `startTransition`).
 * Колонки сюда не входят — у них по-прежнему Query `onMutate`.
 */
export type BoardOptimisticAction =
  | { type: "add"; columnId: string; card: BoardCard }
  | {
      type: "patch";
      cardId: string;
      title?: string;
      description?: string | null;
    }
  | { type: "remove"; cardId: string };

export function applyBoardOptimistic(
  board: BoardDetail | undefined,
  action: BoardOptimisticAction,
): BoardDetail | undefined {
  if (!board) {
    return board;
  }

  switch (action.type) {
    case "add":
      return {
        ...board,
        columns: board.columns.map((column) => {
          if (column.id !== action.columnId) {
            return column;
          }

          if (column.cards.some((card) => card.id === action.card.id)) {
            return column;
          }

          return {
            ...column,
            cards: [
              ...column.cards,
              {
                ...action.card,
                columnId: column.id,
                position: column.cards.length,
              },
            ],
          };
        }),
      };
    case "patch":
      return {
        ...board,
        columns: board.columns.map((column) => ({
          ...column,
          cards: column.cards.map((card) => {
            if (card.id !== action.cardId) {
              return card;
            }

            return {
              ...card,
              ...(action.title !== undefined ? { title: action.title } : {}),
              ...(action.description !== undefined
                ? { description: action.description }
                : {}),
            };
          }),
        })),
      };
    case "remove":
      return {
        ...board,
        columns: board.columns.map((column) => ({
          ...column,
          cards: column.cards.filter((card) => card.id !== action.cardId),
        })),
      };
  }
}

export function useBoardOptimistic(board: BoardDetail | undefined) {
  return useOptimistic(board, applyBoardOptimistic);
}

const BoardOptimisticContext = createContext<
  ((action: BoardOptimisticAction) => void) | null
>(null);

export function BoardOptimisticProvider({
  apply,
  children,
}: {
  apply: (action: BoardOptimisticAction) => void;
  children: ReactNode;
}) {
  return (
    <BoardOptimisticContext.Provider value={apply}>
      {children}
    </BoardOptimisticContext.Provider>
  );
}

export function useApplyBoardOptimistic() {
  const apply = useContext(BoardOptimisticContext);
  if (!apply) {
    throw new Error("useApplyBoardOptimistic requires BoardOptimisticProvider");
  }
  return apply;
}
