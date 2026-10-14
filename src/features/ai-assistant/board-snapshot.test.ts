import { expect, test } from "vitest";
import {
  BOARD_SNAPSHOT_MAX_CARDS,
  BOARD_SNAPSHOT_TITLE_MAX,
  boardCardCount,
  boardSnapshot,
  cardIdAtPick,
} from "@/features/ai-assistant/board-snapshot";
import { makeBoard } from "@/features/board/board-fixture";

test("boardSnapshot is (no cards) when the board has empty columns", () => {
  const board = makeBoard({
    title: "Empty sprint",
    columns: [
      { title: "To Do", cards: [] },
      { title: "Done", cards: [] },
    ],
  });

  expect(boardSnapshot(board)).toBe("Board: Empty sprint\n(no cards)");
});

test("boardSnapshot lists cards in column order with 1-based indices", () => {
  const board = makeBoard({
    title: "Sprint",
    columns: [
      { title: "To Do", cards: [{ title: "Login" }, { title: "OAuth" }] },
      { title: "In Progress", cards: [{ title: "Payments" }] },
      { title: "Done", cards: [] },
    ],
  });

  expect(boardSnapshot(board)).toBe(
    [
      "Board: Sprint",
      "[1] To Do: Login",
      "[2] To Do: OAuth",
      "[3] In Progress: Payments",
    ].join("\n"),
  );
});

test("boardSnapshot clips long titles and omits descriptions", () => {
  const long = "x".repeat(BOARD_SNAPSHOT_TITLE_MAX + 12);
  const clipped = "x".repeat(BOARD_SNAPSHOT_TITLE_MAX);
  const board = makeBoard({
    title: long,
    columns: [
      {
        title: long,
        cards: [{ title: long, description: "secret leftover" }],
      },
    ],
  });

  const snapshot = boardSnapshot(board);
  expect(snapshot).toBe(`Board: ${clipped}\n[1] ${clipped}: ${clipped}`);
  expect(snapshot).not.toContain("secret leftover");
  expect(snapshot).not.toContain(board.id);
});

test("boardSnapshot caps cards and notes how many were omitted", () => {
  const cards = Array.from(
    { length: BOARD_SNAPSHOT_MAX_CARDS + 3 },
    (_, i) => ({
      title: `Card ${i + 1}`,
    }),
  );
  const board = makeBoard({
    title: "Busy",
    columns: [{ title: "To Do", cards }],
  });

  const snapshot = boardSnapshot(board);
  expect(snapshot).toContain(`[1] To Do: Card 1`);
  expect(snapshot).toContain(
    `[${BOARD_SNAPSHOT_MAX_CARDS}] To Do: Card ${BOARD_SNAPSHOT_MAX_CARDS}`,
  );
  expect(snapshot).not.toContain(`Card ${BOARD_SNAPSHOT_MAX_CARDS + 1}`);
  expect(snapshot.endsWith("(+3 omitted)")).toBe(true);
});

test("boardCardCount sums cards across columns", () => {
  expect(
    boardCardCount(
      makeBoard({
        columns: [
          { title: "To Do", cards: [] },
          { title: "Done", cards: [] },
        ],
      }),
    ),
  ).toBe(0);
  expect(
    boardCardCount(
      makeBoard({
        columns: [
          { title: "To Do", cards: [{ title: "A" }, { title: "B" }] },
          { title: "Done", cards: [{ title: "C" }] },
        ],
      }),
    ),
  ).toBe(3);
});

test("cardIdAtPick follows snapshot order and ignores picks past the cap", () => {
  const board = makeBoard({
    columns: [
      {
        title: "To Do",
        cards: [
          { id: "card-login", title: "Login" },
          { id: "card-oauth", title: "OAuth" },
        ],
      },
      { title: "Done", cards: [{ id: "card-pay", title: "Payments" }] },
    ],
  });

  expect(cardIdAtPick(board, 1)).toBe("card-login");
  expect(cardIdAtPick(board, 2)).toBe("card-oauth");
  expect(cardIdAtPick(board, 3)).toBe("card-pay");
  expect(cardIdAtPick(board, 0)).toBeUndefined();
  expect(cardIdAtPick(board, 4)).toBeUndefined();
  expect(cardIdAtPick(board, 1.5)).toBeUndefined();
});

test("cardIdAtPick does not map omitted cards past the snapshot cap", () => {
  const cards = Array.from(
    { length: BOARD_SNAPSHOT_MAX_CARDS + 2 },
    (_, i) => ({
      id: `card-${i + 1}`,
      title: `Card ${i + 1}`,
    }),
  );
  const board = makeBoard({
    columns: [{ title: "To Do", cards }],
  });

  expect(cardIdAtPick(board, BOARD_SNAPSHOT_MAX_CARDS)).toBe(
    `card-${BOARD_SNAPSHOT_MAX_CARDS}`,
  );
  expect(cardIdAtPick(board, BOARD_SNAPSHOT_MAX_CARDS + 1)).toBeUndefined();
});
