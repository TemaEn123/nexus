import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  SuggestEmpty,
  SuggestingLabel,
  SuggestReasonSkeleton,
  SuggestRetry,
  SuggestSubtasksSkeleton,
} from "@/features/ai-assistant/suggest-stream-status";

test("SuggestingLabel is a polite live region", () => {
  const { getByText } = render(<SuggestingLabel />);
  expect(getByText("Suggesting…").getAttribute("aria-live")).toBe("polite");
});

test("skeletons are hidden from the accessibility tree", () => {
  const { container } = render(
    <>
      <SuggestSubtasksSkeleton />
      <SuggestReasonSkeleton />
    </>,
  );

  expect(container.querySelectorAll("[aria-hidden='true']").length).toBe(2);
  expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
});

test("SuggestRetry calls onRetry", () => {
  const onRetry = vi.fn();
  const { getByRole } = render(<SuggestRetry className="" onRetry={onRetry} />);

  getByRole("button", { name: "Retry" }).click();
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test("SuggestEmpty is not an alert", () => {
  const { getByText, queryByRole } = render(<SuggestEmpty />);

  expect(getByText("No suggestions")).toBeTruthy();
  expect(queryByRole("alert")).toBeNull();
});
