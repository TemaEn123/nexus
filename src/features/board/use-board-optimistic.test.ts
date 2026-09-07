import { describe, expect, test } from "vitest";
import { makeBoard, makeCard } from "@/features/board/board-fixture";
import type { BoardDetail } from "@/features/board/types";
import { applyBoardOptimistic } from "@/features/board/use-board-optimistic";

function cardsOf(board: BoardDetail | undefined, columnId: string) {
  return board?.columns.find((column) => column.id === columnId)?.cards ?? [];
}

describe("applyBoardOptimistic", () => {
  test("returns undefined when there is no board", () => {
    expect(
      applyBoardOptimistic(undefined, { type: "remove", cardId: "card-1" }),
    ).toBeUndefined();
  });

  test("add appends to the target column and rewrites columnId and position", () => {
    const board = makeBoard();
    const snapshot = structuredClone(board);
    const next = applyBoardOptimistic(board, {
      type: "add",
      columnId: "column-1",
      card: makeCard({
        id: "card-new",
        title: "New",
        columnId: "wrong",
        position: 99,
      }),
    });

    expect(board).toEqual(snapshot);
    expect(cardsOf(next, "column-1")).toMatchObject([
      { id: "card-1", title: "Write tests" },
      { id: "card-new", title: "New", columnId: "column-1", position: 1 },
    ]);
    expect(cardsOf(next, "column-2")).toEqual([]);
  });

  test("add does not duplicate an existing card id", () => {
    const board = makeBoard();
    const next = applyBoardOptimistic(board, {
      type: "add",
      columnId: "column-1",
      card: makeCard({ id: "card-1", title: "Duplicate" }),
    });

    expect(cardsOf(next, "column-1")).toHaveLength(1);
    expect(cardsOf(next, "column-1")[0]?.title).toBe("Write tests");
  });

  test("patch title does not clear description; patch description keeps title", () => {
    const board = makeBoard({
      columns: [
        {
          cards: [
            { id: "card-1", title: "Keep me", description: "old" },
            { id: "card-2", title: "Neighbor" },
          ],
        },
        { cards: [] },
      ],
    });

    const titled = applyBoardOptimistic(board, {
      type: "patch",
      cardId: "card-1",
      title: "Renamed",
    });
    expect(cardsOf(titled, "column-1")[0]).toMatchObject({
      title: "Renamed",
      description: "old",
    });
    expect(cardsOf(titled, "column-1")[1]?.title).toBe("Neighbor");

    const described = applyBoardOptimistic(board, {
      type: "patch",
      cardId: "card-1",
      description: null,
    });
    expect(cardsOf(described, "column-1")[0]).toMatchObject({
      title: "Keep me",
      description: null,
    });
  });

  test("remove drops the card and leaves neighbors", () => {
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

    const next = applyBoardOptimistic(board, {
      type: "remove",
      cardId: "card-1",
    });

    expect(cardsOf(next, "column-1")).toMatchObject([
      { id: "card-2", title: "Stay" },
    ]);
  });
});
