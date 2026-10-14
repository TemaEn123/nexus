import { expect, test } from "vitest";
import {
  SUGGEST_PRIORITY_INSTRUCTIONS,
  SUGGEST_SUBTASKS_INSTRUCTIONS,
  suggestPriorityPrompt,
  suggestSubtasksPrompt,
} from "@/features/ai-assistant/prompt";
import { makeBoard } from "@/features/board/board-fixture";

const board = makeBoard({
  title: "Sprint",
  columns: [
    {
      title: "To Do",
      cards: [
        { title: "Login", description: "secret leftover" },
        { title: "Ship MVP" },
      ],
    },
    { title: "Done", cards: [{ title: "OAuth" }] },
  ],
});

test("suggestSubtasksPrompt includes a trimmed description and the board snapshot", () => {
  expect(
    suggestSubtasksPrompt(
      {
        title: "Ship MVP",
        description: "  Split auth and kanban.  ",
      },
      board,
    ),
  ).toBe(
    [
      "Board: Sprint",
      "[1] To Do: Login",
      "[2] To Do: Ship MVP",
      "[3] Done: OAuth",
      "",
      "Target card:",
      "Title: Ship MVP",
      "Description: Split auth and kanban.",
    ].join("\n"),
  );
});

test("suggestSubtasksPrompt omits a missing or blank description", () => {
  expect(
    suggestSubtasksPrompt({ title: "Ship MVP", description: null }, board),
  ).toBe(
    [
      "Board: Sprint",
      "[1] To Do: Login",
      "[2] To Do: Ship MVP",
      "[3] Done: OAuth",
      "",
      "Target card:",
      "Title: Ship MVP",
    ].join("\n"),
  );
  expect(
    suggestSubtasksPrompt({ title: "Ship MVP", description: "   " }, board),
  ).toContain("Title: Ship MVP");
  expect(
    suggestSubtasksPrompt({ title: "Ship MVP", description: "   " }, board),
  ).not.toContain("Description:");
});

test("suggestSubtasksPrompt does not dump sibling descriptions or ids", () => {
  const prompt = suggestSubtasksPrompt(
    { title: "Ship MVP", description: null },
    board,
  );

  expect(prompt).not.toContain("secret leftover");
  expect(prompt).not.toContain(board.id);
  expect(prompt).not.toContain(board.columns[0].cards[0].id);
});

test("suggestSubtasksPrompt still works when the board has no cards", () => {
  const empty = makeBoard({
    title: "Empty sprint",
    columns: [
      { title: "To Do", cards: [] },
      { title: "Done", cards: [] },
    ],
  });

  expect(
    suggestSubtasksPrompt({ title: "Ship MVP", description: null }, empty),
  ).toBe(
    [
      "Board: Empty sprint",
      "(no cards)",
      "",
      "Target card:",
      "Title: Ship MVP",
    ].join("\n"),
  );
});

test("instructions tell the model not to copy titles already on the board", () => {
  expect(SUGGEST_SUBTASKS_INSTRUCTIONS).toContain("do not repeat those titles");
  expect(SUGGEST_SUBTASKS_INSTRUCTIONS).toContain("[1] To Do: Login");
});

test("suggestPriorityPrompt is the snapshot plus a next-card question", () => {
  expect(suggestPriorityPrompt(board)).toBe(
    [
      "Which card should be next?",
      "Board: Sprint",
      "[1] To Do: Login",
      "[2] To Do: Ship MVP",
      "[3] Done: OAuth",
    ].join("\n"),
  );
});

test("suggestPriorityPrompt does not dump descriptions or ids", () => {
  const prompt = suggestPriorityPrompt(board);

  expect(prompt).not.toContain("secret leftover");
  expect(prompt).not.toContain(board.id);
  expect(prompt).not.toContain(board.columns[0].cards[0].id);
});

test("priority instructions bind pick to the list index, not a UUID", () => {
  expect(SUGGEST_PRIORITY_INSTRUCTIONS).toContain(
    "pick is the [n] integer from the board list",
  );
  expect(SUGGEST_PRIORITY_INSTRUCTIONS).toContain("not a UUID");
  expect(SUGGEST_PRIORITY_INSTRUCTIONS).toContain("[1] To Do: Login");
});
