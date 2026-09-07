import { expect, test } from "vitest";
import { makeBoard } from "@/features/board/board-fixture";

test("makeBoard uses ISO date strings and wires parent ids", () => {
  const board = makeBoard({
    columns: [
      { cards: [{ title: "One" }, { id: "card-custom", title: "Two" }] },
      { id: "column-done", title: "Done" },
    ],
  });

  expect(board.createdAt).toBe("2026-01-15T12:00:00.000Z");
  expect(typeof board.updatedAt).toBe("string");
  expect(board.columns[0]?.boardId).toBe(board.id);
  expect(board.columns[0]?.cards[0]).toMatchObject({
    title: "One",
    position: 0,
    columnId: board.columns[0].id,
  });
  expect(board.columns[1]).toMatchObject({
    id: "column-done",
    title: "Done",
    position: 1,
    cards: [],
  });
  expect(board.columns[0]?.cards[1]?.id).toBe("card-custom");
});
