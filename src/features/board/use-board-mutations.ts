"use client";

import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createTempId } from "@/features/board/temp-id";
import type { BoardDetail } from "@/features/board/types";
import { createColumn, deleteColumn } from "@/shared/api/board";
import { boardKeys } from "@/shared/api/query-keys";

type BoardQueryKey = ReturnType<typeof boardKeys.detail>;

async function takeSnapshot(queryClient: QueryClient, queryKey: BoardQueryKey) {
  await queryClient.cancelQueries({ queryKey });
  return queryClient.getQueryData<BoardDetail>(queryKey);
}

function restoreSnapshot(
  queryClient: QueryClient,
  queryKey: BoardQueryKey,
  previous: BoardDetail | undefined,
) {
  if (previous) {
    queryClient.setQueryData(queryKey, previous);
  }
}

export function useCreateColumnMutation(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: ({ title }: { title: string }) =>
      createColumn({ boardId, title }),
    onMutate: async ({ title }) => {
      const tempId = createTempId();
      const previous = await takeSnapshot(queryClient, queryKey);
      queryClient.setQueryData<BoardDetail>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          columns: [
            ...current.columns,
            {
              id: tempId,
              title,
              position: current.columns.length,
              boardId,
              createdAt: new Date(),
              updatedAt: new Date(),
              cards: [],
            },
          ],
        };
      });
      return { previous, tempId };
    },
    onError: (_error, _variables, context) => {
      restoreSnapshot(queryClient, queryKey, context?.previous);
    },
    onSuccess: (column, _variables, context) => {
      const tempId = context?.tempId;
      if (!tempId) {
        return;
      }

      queryClient.setQueryData<BoardDetail>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          columns: current.columns.map((item) =>
            item.id === tempId ? { ...column, cards: item.cards } : item,
          ),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteColumnMutation(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: ({ columnId }: { columnId: string }) => deleteColumn(columnId),
    onMutate: async ({ columnId }) => {
      const previous = await takeSnapshot(queryClient, queryKey);
      queryClient.setQueryData<BoardDetail>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          columns: current.columns.filter((column) => column.id !== columnId),
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      restoreSnapshot(queryClient, queryKey, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
