"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BoardColumn, BoardDetail } from "@/features/board/types";
import { moveCard } from "@/shared/api/board";
import { boardKeys } from "@/shared/api/query-keys";

type MoveCardVariables = {
  cardId: string;
  columnId: string;
  position: number;
  columns: BoardColumn[];
};

/**
 * Drop: кэш сразу в порядок preview, PATCH, ошибка — snapshot.
 * `PATCH` отдаёт одну карточку, не доску — полный порядок после shift
 * подтягиваем invalidate, не `onSuccess`.
 */
export function useMoveCardMutation(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: ({ cardId, columnId, position }: MoveCardVariables) =>
      moveCard({ cardId, columnId, position }),
    onMutate: async ({ columns }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardDetail>(queryKey);
      queryClient.setQueryData<BoardDetail>(queryKey, (current) =>
        current ? { ...current, columns } : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
