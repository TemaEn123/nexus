import { expect, test } from "vitest";
import { BOARD_SNAPSHOT_MAX_CARDS } from "@/features/ai-assistant/board-snapshot";
import {
  SUGGEST_PRIORITY_REASON_MAX,
  SUGGEST_SUBTASKS_MAX,
  SUGGEST_SUBTASKS_MIN,
  suggestPrioritySchema,
  suggestSubtasksSchema,
} from "@/features/ai-assistant/schemas";

function payload(count: number, title = "Step") {
  return {
    subtasks: Array.from({ length: count }, () => ({ title })),
  };
}

test("suggestSubtasksSchema accepts 3–7 trimmed titles", () => {
  expect(
    suggestSubtasksSchema.safeParse(payload(SUGGEST_SUBTASKS_MIN)).success,
  ).toBe(true);
  expect(
    suggestSubtasksSchema.safeParse({
      subtasks: [
        { title: "  Draft API  " },
        { title: "Write UI" },
        { title: "Ship" },
      ],
    }),
  ).toEqual({
    success: true,
    data: {
      subtasks: [
        { title: "Draft API" },
        { title: "Write UI" },
        { title: "Ship" },
      ],
    },
  });
  expect(
    suggestSubtasksSchema.safeParse(payload(SUGGEST_SUBTASKS_MAX)).success,
  ).toBe(true);
});

test("suggestSubtasksSchema rejects count and title length outside the contract", () => {
  expect(
    suggestSubtasksSchema.safeParse(payload(SUGGEST_SUBTASKS_MIN - 1)).success,
  ).toBe(false);
  expect(
    suggestSubtasksSchema.safeParse(payload(SUGGEST_SUBTASKS_MAX + 1)).success,
  ).toBe(false);
  expect(
    suggestSubtasksSchema.safeParse({
      subtasks: [{ title: "Ok" }, { title: "Ok" }, { title: "a".repeat(201) }],
    }).success,
  ).toBe(false);
});

test("suggestPrioritySchema accepts a 1-based pick and trimmed reason", () => {
  expect(
    suggestPrioritySchema.safeParse({
      pick: 1,
      reason: "  Login unblocks OAuth.  ",
    }),
  ).toEqual({
    success: true,
    data: { pick: 1, reason: "Login unblocks OAuth." },
  });
  expect(
    suggestPrioritySchema.safeParse({
      pick: BOARD_SNAPSHOT_MAX_CARDS,
      reason: "Last visible card",
    }).success,
  ).toBe(true);
});

test("suggestPrioritySchema rejects pick and reason outside the contract", () => {
  expect(
    suggestPrioritySchema.safeParse({ pick: 0, reason: "Too small" }).success,
  ).toBe(false);
  expect(
    suggestPrioritySchema.safeParse({
      pick: BOARD_SNAPSHOT_MAX_CARDS + 1,
      reason: "Too big",
    }).success,
  ).toBe(false);
  expect(
    suggestPrioritySchema.safeParse({ pick: 1.5, reason: "Not an int" })
      .success,
  ).toBe(false);
  expect(
    suggestPrioritySchema.safeParse({ pick: 1, reason: "   " }).success,
  ).toBe(false);
  expect(
    suggestPrioritySchema.safeParse({
      pick: 1,
      reason: "a".repeat(SUGGEST_PRIORITY_REASON_MAX + 1),
    }).success,
  ).toBe(false);
});
