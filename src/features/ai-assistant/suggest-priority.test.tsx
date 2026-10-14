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

test("SuggestPriority shows a reason skeleton while loading without a reason", () => {
  const { getByText, container, queryByRole } = render(
    <SuggestPriority
      disabled={false}
      error={undefined}
      isLoading
      onStop={vi.fn()}
      onSuggest={vi.fn()}
      reason={undefined}
    />,
  );

  expect(getByText("Suggesting…").getAttribute("aria-live")).toBe("polite");
  expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  expect(queryByRole("button", { name: "Retry" })).toBeNull();
});

test("SuggestPriority shows Retry after an error", () => {
  const onSuggest = vi.fn();
  const { getByRole } = render(
    <SuggestPriority
      disabled={false}
      error="AI is not configured. Add GROQ_API_KEY."
      isLoading={false}
      onStop={vi.fn()}
      onSuggest={onSuggest}
      reason={undefined}
    />,
  );

  getByRole("button", { name: "Retry" }).click();
  expect(onSuggest).toHaveBeenCalledTimes(1);
});

test("SuggestPriority Stop does not show an alert", () => {
  const onStop = vi.fn();
  const { getByRole, queryByRole } = render(
    <SuggestPriority
      disabled={false}
      error={undefined}
      isLoading
      onStop={onStop}
      onSuggest={vi.fn()}
      reason="Login unblocks OAuth."
    />,
  );

  getByRole("button", { name: "Stop suggesting priority" }).click();
  expect(onStop).toHaveBeenCalledTimes(1);
  expect(queryByRole("alert")).toBeNull();
});

test("SuggestPriority shows No suggestions and Retry without an alert", () => {
  const onSuggest = vi.fn();
  const { getByText, getByRole, queryByRole } = render(
    <SuggestPriority
      disabled={false}
      empty
      error={undefined}
      isLoading={false}
      onStop={vi.fn()}
      onSuggest={onSuggest}
      reason={undefined}
    />,
  );

  expect(getByText("No suggestions")).toBeTruthy();
  expect(queryByRole("alert")).toBeNull();
  getByRole("button", { name: "Retry" }).click();
  expect(onSuggest).toHaveBeenCalledTimes(1);
});
