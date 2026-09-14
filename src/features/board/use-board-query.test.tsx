import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { makeBoard } from "@/features/board/board-fixture";
import {
  createTestQueryClient,
  createWrapper,
} from "@/features/board/query-test";
import {
  shouldRefetchBoard,
  useBoardQuery,
} from "@/features/board/use-board-query";
import { fetchBoard } from "@/shared/api/board";
import { boardKeys } from "@/shared/api/query-keys";

vi.mock("@/shared/api/board", () => ({
  fetchBoard: vi.fn(),
  moveCard: vi.fn(),
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
}));

const board = makeBoard();

afterEach(() => {
  vi.clearAllMocks();
});

test("useBoardQuery loads by boardId into boardKeys.detail", async () => {
  vi.mocked(fetchBoard).mockResolvedValue(board);
  const queryClient = createTestQueryClient();

  const { result } = renderHook(() => useBoardQuery("board-1"), {
    wrapper: createWrapper(queryClient),
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(fetchBoard).toHaveBeenCalledWith("board-1");
  expect(queryClient.getQueryData(boardKeys.detail("board-1"))).toEqual(board);
});

test("shouldRefetchBoard reads the current dragging ref", () => {
  const draggingRef = { current: false };

  expect(shouldRefetchBoard()).toBe(true);
  expect(shouldRefetchBoard(draggingRef)).toBe(true);

  draggingRef.current = true;
  expect(shouldRefetchBoard(draggingRef)).toBe(false);
});
