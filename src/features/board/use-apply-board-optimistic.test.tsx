import { renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  BoardOptimisticProvider,
  useApplyBoardOptimistic,
} from "@/features/board/use-board-optimistic";

test("useApplyBoardOptimistic throws without a provider", () => {
  expect(() => {
    renderHook(() => useApplyBoardOptimistic());
  }).toThrow("useApplyBoardOptimistic requires BoardOptimisticProvider");
});

test("useApplyBoardOptimistic returns the provided apply", () => {
  const apply = vi.fn();
  const { result } = renderHook(() => useApplyBoardOptimistic(), {
    wrapper: ({ children }) => (
      <BoardOptimisticProvider apply={apply}>
        {children}
      </BoardOptimisticProvider>
    ),
  });

  result.current({ type: "remove", cardId: "card-1" });
  expect(apply).toHaveBeenCalledWith({ type: "remove", cardId: "card-1" });
});
