"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBoard } from "@/shared/api/board";
import { boardKeys } from "@/shared/api/query-keys";

/**
 * `refetchOnWindowFocus` во время drag не должен перетирать preview:
 * колбэк читает ref, не stale closure.
 */
export function shouldRefetchBoard(draggingRef?: { current: boolean }) {
  return !draggingRef?.current;
}

export function useBoardQuery(
  boardId: string,
  draggingRef?: { current: boolean },
) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => fetchBoard(boardId),
    refetchOnWindowFocus: () => shouldRefetchBoard(draggingRef),
    refetchOnReconnect: () => shouldRefetchBoard(draggingRef),
  });
}
