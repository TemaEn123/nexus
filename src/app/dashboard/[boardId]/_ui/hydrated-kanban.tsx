import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Providers } from "@/app/providers";
import { toBoardDto } from "@/features/board/dto";
import type { BoardRecord } from "@/features/board/types";
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
  boardPromise: Promise<BoardRecord>;
}) {
  const board = await boardPromise;
  const queryClient = makeQueryClient();
  queryClient.setQueryData(boardKeys.detail(board.id), toBoardDto(board));

  return (
    <Providers>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <KanbanBoard boardId={board.id} />
      </HydrationBoundary>
    </Providers>
  );
}
