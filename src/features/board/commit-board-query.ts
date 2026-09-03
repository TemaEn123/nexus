"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { BoardCard, BoardDetail } from "@/features/board/types";
import { applyBoardOptimistic } from "@/features/board/use-board-optimistic";
import { boardKeys } from "@/shared/api/query-keys";

/**
 * После Server Action: кэш = то, что уже видно (cuid / новый текст / без карточки).
 * Сначала setQueryData, потом invalidate — иначе overlay откатится на старый кэш.
 */
export async function commitBoardQuery(
  queryClient: QueryClient,
  boardId: string,
  update: (board: BoardDetail) => BoardDetail,
) {
  const queryKey = boardKeys.detail(boardId);
  await queryClient.cancelQueries({ queryKey });
  queryClient.setQueryData<BoardDetail>(queryKey, (current) =>
    current ? update(current) : current,
  );
  void queryClient.invalidateQueries({ queryKey });
}

/** Temp жил в overlay, не в Query. Подставить cuid или дописать карточку. */
export function commitCreatedCard(
  board: BoardDetail,
  columnId: string,
  tempId: string,
  card: BoardCard,
): BoardDetail {
  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id !== columnId) {
        return column;
      }

      if (column.cards.some((item) => item.id === tempId)) {
        return {
          ...column,
          cards: column.cards.map((item) => (item.id === tempId ? card : item)),
        };
      }

      if (column.cards.some((item) => item.id === card.id)) {
        return column;
      }

      return { ...column, cards: [...column.cards, card] };
    }),
  };
}

export function commitPatchedCard(
  board: BoardDetail,
  card: BoardCard,
): BoardDetail {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map((item) => (item.id === card.id ? card : item)),
    })),
  };
}

export function commitRemovedCard(
  board: BoardDetail,
  cardId: string,
): BoardDetail {
  return applyBoardOptimistic(board, { type: "remove", cardId }) ?? board;
}
