import { afterEach, describe, expect, test, vi } from "vitest";
import { makeBoard, makeCard } from "@/features/board/board-fixture";
import {
  commitBoardQuery,
  commitCreatedCard,
  commitPatchedCard,
  commitRemovedCard,
} from "@/features/board/commit-board-query";
import { createTestQueryClient } from "@/features/board/query-test";
import { boardKeys } from "@/shared/api/query-keys";

function cardsOf(board: ReturnType<typeof makeBoard>, columnId: string) {
  return board.columns.find((column) => column.id === columnId)?.cards ?? [];
}

describe("commitCreatedCard", () => {
  test("replaces a temp overlay card with the server card", () => {
    const board = makeBoard({
      columns: [
        {
          cards: [
            { id: "card-1", title: "Write tests" },
            { id: "temp-1", title: "Draft" },
          ],
        },
        { cards: [] },
      ],
    });
    const serverCard = makeCard({
      id: "card-real",
      title: "Draft",
      columnId: "column-1",
      position: 1,
    });

    const next = commitCreatedCard(board, "column-1", "temp-1", serverCard);

    expect(cardsOf(next, "column-1")).toMatchObject([
      { id: "card-1" },
      { id: "card-real", title: "Draft" },
    ]);
    expect(cardsOf(next, "column-1")).toHaveLength(2);
  });

  test("appends when the temp id is already gone", () => {
    const board = makeBoard();
    const serverCard = makeCard({
      id: "card-real",
      title: "Draft",
      columnId: "column-1",
      position: 1,
    });

    const next = commitCreatedCard(board, "column-1", "temp-1", serverCard);

    expect(cardsOf(next, "column-1")).toMatchObject([
      { id: "card-1" },
      { id: "card-real" },
    ]);
  });

  test("does not duplicate a card that already has the server id", () => {
    const board = makeBoard();
    const next = commitCreatedCard(
      board,
      "column-1",
      "temp-1",
      makeCard({ id: "card-1", title: "Write tests" }),
    );

    expect(cardsOf(next, "column-1")).toHaveLength(1);
    expect(cardsOf(next, "column-1")[0]?.id).toBe("card-1");
  });
});

describe("commitPatchedCard", () => {
  test("replaces the matching card with the server payload", () => {
    const board = makeBoard();
    const next = commitPatchedCard(
      board,
      makeCard({
        id: "card-1",
        title: "Renamed",
        description: "from server",
        columnId: "column-1",
      }),
    );

    expect(cardsOf(next, "column-1")[0]).toMatchObject({
      id: "card-1",
      title: "Renamed",
      description: "from server",
    });
    expect(cardsOf(next, "column-2")).toEqual([]);
  });
});

describe("commitRemovedCard", () => {
  test("drops the card via the optimistic remove reducer", () => {
    const board = makeBoard({
      columns: [
        {
          cards: [
            { id: "card-1", title: "Gone" },
            { id: "card-2", title: "Stay" },
          ],
        },
        { cards: [] },
      ],
    });

    expect(
      cardsOf(commitRemovedCard(board, "card-1"), "column-1"),
    ).toMatchObject([{ id: "card-2", title: "Stay" }]);
  });
});

describe("commitBoardQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("cancels, writes the cache, then invalidates", async () => {
    const board = makeBoard();
    const queryClient = createTestQueryClient();
    const queryKey = boardKeys.detail("board-1");
    queryClient.setQueryData(queryKey, board);

    const cancel = vi.spyOn(queryClient, "cancelQueries");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await commitBoardQuery(queryClient, "board-1", (current) => ({
      ...current,
      title: "Renamed",
    }));

    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      invalidate.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(cancel).toHaveBeenCalledWith({ queryKey });
    expect(queryClient.getQueryData(queryKey)).toMatchObject({
      title: "Renamed",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey });
  });

  test("does not invent a board when the cache is empty", async () => {
    const queryClient = createTestQueryClient();

    await commitBoardQuery(queryClient, "board-1", (current) => ({
      ...current,
      title: "Renamed",
    }));

    expect(
      queryClient.getQueryData(boardKeys.detail("board-1")),
    ).toBeUndefined();
  });
});
