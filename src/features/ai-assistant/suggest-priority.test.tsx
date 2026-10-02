import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SuggestPriority } from "@/features/ai-assistant/suggest-priority";

test("SuggestPriority is disabled when the board has no cards", () => {
  const { getByRole } = render(
    <SuggestPriority
      disabled
      error={undefined}
      isLoading={false}
      onStop={vi.fn()}
      onSuggest={vi.fn()}
      reason={undefined}
    />,
  );

  expect(
    (getByRole("button", { name: "Suggest priority" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

test("SuggestPriority shows reason and Stop while loading", () => {
  const { getByRole, getByText, queryByRole } = render(
    <SuggestPriority
      disabled={false}
      error={undefined}
      isLoading
      onStop={vi.fn()}
      onSuggest={vi.fn()}
      reason="Login unblocks OAuth."
    />,
  );

  expect(
    (
      getByRole("button", {
        name: "Stop suggesting priority",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  expect(queryByRole("button", { name: "Suggest priority" })).toBeNull();
  expect(getByText("Suggesting…")).toBeTruthy();
  expect(getByRole("status").textContent).toBe("Login unblocks OAuth.");
});
