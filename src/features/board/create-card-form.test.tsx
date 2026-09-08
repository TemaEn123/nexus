import type { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  type CardWriteResult,
  createCardAction,
} from "@/features/board/actions";
import { makeCard } from "@/features/board/board-fixture";
import { CreateCardForm } from "@/features/board/create-card-form";
import { deferred } from "@/features/board/query-test";
import { isTempId } from "@/features/board/temp-id";
import type { BoardDetail } from "@/features/board/types";
import { boardKeys } from "@/shared/api/query-keys";
import { readOptimisticCards, renderBoardForm } from "@/test/render-board";

vi.mock("@/features/board/actions", () => ({
  createCardAction: vi.fn(),
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function cardsOf(queryClient: QueryClient, boardId: string, columnId: string) {
  return (
    queryClient
      .getQueryData<BoardDetail>(boardKeys.detail(boardId))
      ?.columns.find((column) => column.id === columnId)?.cards ?? []
  );
}

test("CreateCardForm rejects a blank title without calling the action", async () => {
  const { user, queryClient, board, getByRole } = renderBoardForm(
    <CreateCardForm boardId="board-1" columnId="column-1" />,
  );

  await user.type(getByRole("textbox", { name: "New card" }), "   ");
  await user.click(getByRole("button", { name: "Add card" }));

  expect(createCardAction).not.toHaveBeenCalled();
  expect(getByRole("alert").textContent).toBe(
    "Card title is required (1–200 characters).",
  );
  expect(cardsOf(queryClient, board.id, "column-1")).toHaveLength(1);
});

test("CreateCardForm overlays a temp card then commits the action id", async () => {
  const pending = deferred<CardWriteResult>();
  vi.mocked(createCardAction).mockReturnValue(pending.promise);

  const { user, queryClient, board, getByRole, getByTestId } = renderBoardForm(
    <CreateCardForm boardId="board-1" columnId="column-1" />,
  );
  const input = getByRole("textbox", { name: "New card" });

  await user.type(input, "Review");
  await user.click(getByRole("button", { name: "Add card" }));

  await waitFor(() => {
    const overlay = readOptimisticCards(getByTestId("optimistic-cards"));
    expect(overlay.at(-1)?.title).toBe("Review");
    expect(isTempId(overlay.at(-1)?.id ?? "")).toBe(true);
  });
  expect(
    cardsOf(queryClient, board.id, "column-1").map((card) => card.id),
  ).toEqual(["card-1"]);

  const formData = vi.mocked(createCardAction).mock.calls[0]?.[0];
  expect(formData).toBeInstanceOf(FormData);
  expect(formData?.get("title")).toBe("Review");
  expect(formData?.get("boardId")).toBe("board-1");
  expect(formData?.get("columnId")).toBe("column-1");
  expect(formData?.has("position")).toBe(false);

  pending.resolve({
    ok: true,
    card: makeCard({
      id: "card-action",
      title: "Review",
      columnId: "column-1",
      position: 1,
    }),
  });

  await waitFor(() => {
    expect(cardsOf(queryClient, board.id, "column-1")).toMatchObject([
      { id: "card-1" },
      { id: "card-action", title: "Review", columnId: "column-1" },
    ]);
  });
  expect(input).toHaveProperty("value", "");
});

test("CreateCardForm shows conflict copy and keeps Query cards", async () => {
  vi.mocked(createCardAction).mockResolvedValue({
    ok: false,
    error: "conflict",
  });

  const { user, queryClient, board, getByRole } = renderBoardForm(
    <CreateCardForm boardId="board-1" columnId="column-1" />,
  );
  const snapshot = cardsOf(queryClient, board.id, "column-1");

  await user.type(getByRole("textbox", { name: "New card" }), "Review");
  await user.click(getByRole("button", { name: "Add card" }));

  await waitFor(() => {
    expect(getByRole("alert").textContent).toBe(
      "Someone else updated the board. Try again.",
    );
  });
  expect(cardsOf(queryClient, board.id, "column-1")).toEqual(snapshot);
});
