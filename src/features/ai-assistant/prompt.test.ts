import { expect, test } from "vitest";
import { suggestSubtasksPrompt } from "@/features/ai-assistant/prompt";

test("suggestSubtasksPrompt includes a trimmed description when present", () => {
  expect(
    suggestSubtasksPrompt({
      title: "Ship MVP",
      description: "  Split auth and kanban.  ",
    }),
  ).toBe("Title: Ship MVP\nDescription: Split auth and kanban.");
});

test("suggestSubtasksPrompt omits a missing or blank description", () => {
  expect(suggestSubtasksPrompt({ title: "Ship MVP", description: null })).toBe(
    "Title: Ship MVP",
  );
  expect(suggestSubtasksPrompt({ title: "Ship MVP", description: "   " })).toBe(
    "Title: Ship MVP",
  );
});
