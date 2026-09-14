import { expect, test } from "vitest";
import {
  SUGGEST_SUBTASKS_MAX,
  SUGGEST_SUBTASKS_MIN,
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
