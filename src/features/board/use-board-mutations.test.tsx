import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  makeBoard,
  makeCard,
  makeColumn,
} from "@/features/board/board-fixture";
import {
  createTestQueryClient,
  createWrapper,
  deferred,
} from "@/features/board/query-test";
import { isTempId } from "@/features/board/temp-id";
import type { BoardColumn, BoardDetail } from "@/features/board/types";
import {
  useCreateColumnMutation,
  useDeleteColumnMutation,
} from "@/features/board/use-board-mutations";
import { createColumn, deleteColumn } from "@/shared/api/board";
import { boardKeys } from "@/shared/api/query-keys";

vi.mock("@/shared/api/board", () => ({
  fetchBoard: vi.fn(),
  moveCard: vi.fn(),
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
}));

const queryKey = boardKeys.detail("board-1");

afterEach(() => {
  vi.clearAllMocks();
});

function lastColumn(board: BoardDetail | undefined) {
  return board?.columns.at(-1);
}

describe("useCreateColumnMutation", () => {
  test("inserts a temp column, then swaps in the server id and keeps cards", async () => {
    const board = makeBoard();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKey, board);

    const pending = deferred<Omit<BoardColumn, "cards">>();
    vi.mocked(createColumn).mockReturnValue(pending.promise);

    const { result } = renderHook(() => useCreateColumnMutation("board-1"), {
      wrapper: createWrapper(queryClient),
    });

    const mutatePromise = result.current.mutateAsync({ title: "Review" });

    await waitFor(() => {
      expect(
        isTempId(lastColumn(queryClient.getQueryData(queryKey))?.id ?? ""),
      ).toBe(true);
    });

    const temp = lastColumn(queryClient.getQueryData(queryKey));
    expect(temp).toMatchObject({
      title: "Review",
      position: 2,
      boardId: "board-1",
      cards: [],
    });

    const parked = makeCard({
      id: "card-parked",
      title: "Parked",
      columnId: temp?.id,
    });
    queryClient.setQueryData<BoardDetail>(queryKey, (current) => {
      if (!current || !temp) {
        return current;
      }

      return {
        ...current,
        columns: current.columns.map((column) =>
          column.id === temp.id ? { ...column, cards: [parked] } : column,
        ),
      };
    });

    const { cards: _cards, ...serverColumn } = makeColumn({
      id: "column-real",
      title: "Review",
      position: 2,
    });
    pending.resolve(serverColumn);
    await mutatePromise;

    const created = lastColumn(queryClient.getQueryData(queryKey));
    expect(created).toMatchObject({
      id: "column-real",
      title: "Review",
      cards: [{ id: "card-parked", title: "Parked" }],
    });
    expect(isTempId(created?.id ?? "temp-x")).toBe(false);
  });

  test("restores the snapshot when create fails", async () => {
    const board = makeBoard();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKey, board);
    vi.mocked(createColumn).mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useCreateColumnMutation("board-1"), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({ title: "Review" }),
    ).rejects.toThrow("offline");

    expect(queryClient.getQueryData(queryKey)).toEqual(board);
  });
});

describe("useDeleteColumnMutation", () => {
  test("removes the column immediately and restores it on error", async () => {
    const board = makeBoard();
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKey, board);

    const pending = deferred<{ id: string }>();
    vi.mocked(deleteColumn).mockReturnValue(pending.promise);

    const { result } = renderHook(() => useDeleteColumnMutation("board-1"), {
      wrapper: createWrapper(queryClient),
    });

    const mutatePromise = result.current.mutateAsync({ columnId: "column-1" });

    await waitFor(() => {
      expect(
        queryClient
          .getQueryData<BoardDetail>(queryKey)
          ?.columns.map((column) => column.id),
      ).toEqual(["column-2"]);
    });

    pending.reject(new Error("offline"));
    await expect(mutatePromise).rejects.toThrow("offline");

    expect(queryClient.getQueryData(queryKey)).toEqual(board);
  });
});
