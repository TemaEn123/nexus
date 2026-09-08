import type { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  type DeleteCardResult,
  deleteCardAction,
} from "@/features/board/actions";
import { makeBoard } from "@/features/board/board-fixture";
import { DeleteCardForm } from "@/features/board/delete-card-form";
import { deferred } from "@/features/board/query-test";
import type { BoardDetail } from "@/features/board/types";
import { boardKeys } from "@/shared/api/query-keys";
import { readOptimisticCards, renderBoardForm } from "@/test/render-board";

vi.mock("@/features/board/actions", () => ({
  createCardAction: vi.fn(),
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function cardsOf(queryClient: QueryClient, boardId: string, columnId: string) {
  return (
    queryClient
      .getQueryData<BoardDetail>(boardKeys.detail(boardId))
      ?.columns.find((column) => column.id === columnId)?.cards ?? []
  );
}

test("DeleteCardForm cancel does not call the action", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const board = makeBoard();
  const onError = vi.fn();
  const { user, queryClient, getByRole } = renderBoardForm(
    <DeleteCardForm
      boardId={board.id}
      cardId="card-1"
      cardTitle="Write tests"
      onError={onError}
    />,
    { board },
  );

  await user.click(getByRole("button", { name: "Delete card Write tests" }));

  expect(deleteCardAction).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  expect(cardsOf(queryClient, board.id, "column-1")).toHaveLength(1);
});

test("DeleteCardForm removes the overlay then commits an empty column", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const pending = deferred<DeleteCardResult>();
  vi.mocked(deleteCardAction).mockReturnValue(pending.promise);

  const board = makeBoard();
  const onError = vi.fn();
  const { user, queryClient, getByRole, getByTestId } = renderBoardForm(
    <DeleteCardForm
      boardId={board.id}
      cardId="card-1"
      cardTitle="Write tests"
      onError={onError}
    />,
    { board },
  );

  await user.click(getByRole("button", { name: "Delete card Write tests" }));

  await waitFor(() => {
    expect(readOptimisticCards(getByTestId("optimistic-cards"))).toEqual([]);
  });
  expect(cardsOf(queryClient, board.id, "column-1")).toHaveLength(1);

  const formData = vi.mocked(deleteCardAction).mock.calls[0]?.[0];
  expect(formData).toBeInstanceOf(FormData);
  expect(formData?.get("boardId")).toBe("board-1");
  expect(formData?.get("cardId")).toBe("card-1");

  pending.resolve({ ok: true });

  await waitFor(() => {
    expect(cardsOf(queryClient, board.id, "column-1")).toEqual([]);
  });
  expect(onError).toHaveBeenCalledWith(undefined);
});

test("DeleteCardForm reports a generic error and keeps the card", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(deleteCardAction).mockResolvedValue({
    ok: false,
    error: "not_found",
  });

  const board = makeBoard();
  const onError = vi.fn();
  const { user, queryClient, getByRole } = renderBoardForm(
    <DeleteCardForm
      boardId={board.id}
      cardId="card-1"
      cardTitle="Write tests"
      onError={onError}
    />,
    { board },
  );

  await user.click(getByRole("button", { name: "Delete card Write tests" }));

  await waitFor(() => {
    expect(onError).toHaveBeenCalledWith("Something went wrong. Try again.");
  });
  expect(cardsOf(queryClient, board.id, "column-1")).toMatchObject([
    { id: "card-1", title: "Write tests" },
  ]);
});
