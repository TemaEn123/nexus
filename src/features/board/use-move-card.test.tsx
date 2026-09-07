import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { makeBoard } from "@/features/board/board-fixture";
import {
  createTestQueryClient,
  createWrapper,
  deferred,
} from "@/features/board/query-test";
import type { BoardCard, BoardDetail } from "@/features/board/types";
import { useMoveCardMutation } from "@/features/board/use-move-card";
import { moveCard } from "@/shared/api/board";
import { boardKeys } from "@/shared/api/query-keys";

vi.mock("@/shared/api/board", () => ({
  fetchBoard: vi.fn(),
  moveCard: vi.fn(),
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

test("useMoveCardMutation writes preview, PATCHes without boardId, rolls back on error", async () => {
  const board = makeBoard();
  const previewBoard = makeBoard({
    columns: [
      { id: "column-1", cards: [] },
      {
        id: "column-2",
        cards: [{ id: "card-1", title: "Write tests" }],
      },
    ],
  });
  const queryKey = boardKeys.detail("board-1");
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(queryKey, board);

  const pending = deferred<BoardCard>();
  vi.mocked(moveCard).mockReturnValue(pending.promise);

  const { result } = renderHook(() => useMoveCardMutation("board-1"), {
    wrapper: createWrapper(queryClient),
  });

  const mutatePromise = result.current.mutateAsync({
    cardId: "card-1",
    columnId: "column-2",
    position: 0,
    columns: previewBoard.columns,
  });

  await waitFor(() => {
    expect(queryClient.getQueryData<BoardDetail>(queryKey)).toEqual({
      ...board,
      columns: previewBoard.columns,
    });
  });
  expect(moveCard).toHaveBeenCalledWith({
    cardId: "card-1",
    columnId: "column-2",
    position: 0,
  });

  pending.reject(new Error("offline"));
  await expect(mutatePromise).rejects.toThrow("offline");

  expect(queryClient.getQueryData(queryKey)).toEqual(board);
});
