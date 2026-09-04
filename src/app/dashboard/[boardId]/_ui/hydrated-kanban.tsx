import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { BoardDetail } from "@/features/board/types";
import { toBoardDto } from "@/shared/api/board";
import { makeQueryClient } from "@/shared/api/query-client";
import { boardKeys } from "@/shared/api/query-keys";
import { KanbanBoard } from "./kanban-board";

/**
 * Hydrate Query после того же `loadBoard`, что и title.
 * Клиент не делает GET сразу. Колонки не дробим на N запросов.
 */
export async function HydratedKanban({
  boardPromise,
}: {
  boardPromise: Promise<BoardDetail>;
}) {
  const board = await boardPromise;
  const queryClient = makeQueryClient();
  queryClient.setQueryData(boardKeys.detail(board.id), toBoardDto(board));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KanbanBoard boardId={board.id} />
    </HydrationBoundary>
  );
}
