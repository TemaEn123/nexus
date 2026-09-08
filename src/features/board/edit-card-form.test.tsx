import type { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { updateCardAction } from "@/features/board/actions";
import { makeBoard, makeCard } from "@/features/board/board-fixture";
import { EditCardForm } from "@/features/board/edit-card-form";
import type { BoardCard, BoardDetail } from "@/features/board/types";
import { boardKeys } from "@/shared/api/query-keys";
import { renderBoardForm } from "@/test/render-board";

vi.mock("@/features/board/actions", () => ({
  createCardAction: vi.fn(),
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function firstCard(board: BoardDetail): BoardCard {
  const card = board.columns[0]?.cards[0];
  if (!card) {
    throw new Error("makeBoard fixture must include a card");
  }
  return card;
}

function cardsOf(queryClient: QueryClient, boardId: string, columnId: string) {
  return (
    queryClient
      .getQueryData<BoardDetail>(boardKeys.detail(boardId))
      ?.columns.find((column) => column.id === columnId)?.cards ?? []
  );
}

test("EditCardForm rejects a blank title without calling the action", async () => {
  const board = makeBoard();
  const onClose = vi.fn();
  const { user, getByRole } = renderBoardForm(
    <EditCardForm
      boardId={board.id}
      card={firstCard(board)}
      onClose={onClose}
    />,
    { board },
  );
  const title = getByRole("textbox", { name: "Title" });

  await user.clear(title);
  await user.type(title, "   ");
  await user.click(getByRole("button", { name: "Save" }));

  expect(updateCardAction).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(getByRole("alert").textContent).toBe(
    "Card title is required (1–200 characters).",
  );
});

test("EditCardForm closes without an action when nothing changed", async () => {
  const board = makeBoard();
  const onClose = vi.fn();
  const { user, getByRole } = renderBoardForm(
    <EditCardForm
      boardId={board.id}
      card={firstCard(board)}
      onClose={onClose}
    />,
    { board },
  );

  await user.click(getByRole("button", { name: "Save" }));

  expect(updateCardAction).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledOnce();
});

test("EditCardForm Cancel and Escape close without an action", async () => {
  const board = makeBoard();
  const onClose = vi.fn();
  const { user, getByRole } = renderBoardForm(
    <EditCardForm
      boardId={board.id}
      card={firstCard(board)}
      onClose={onClose}
    />,
    { board },
  );

  await user.click(getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(updateCardAction).not.toHaveBeenCalled();

  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(2);
});

test("EditCardForm saves a new title into Query cache and closes", async () => {
  const board = makeBoard();
  const onClose = vi.fn();
  vi.mocked(updateCardAction).mockResolvedValue({
    ok: true,
    card: makeCard({
      id: "card-1",
      title: "Renamed",
      description: null,
      columnId: "column-1",
    }),
  });

  const { user, queryClient, getByRole } = renderBoardForm(
    <EditCardForm
      boardId={board.id}
      card={firstCard(board)}
      onClose={onClose}
    />,
    { board },
  );
  const title = getByRole("textbox", { name: "Title" });

  await user.clear(title);
  await user.type(title, "Renamed");
  await user.click(getByRole("button", { name: "Save" }));

  await waitFor(() => {
    expect(cardsOf(queryClient, board.id, "column-1")[0]).toMatchObject({
      id: "card-1",
      title: "Renamed",
    });
  });
  expect(updateCardAction).toHaveBeenCalledWith({
    cardId: "card-1",
    boardId: "board-1",
    title: "Renamed",
    description: null,
  });
  expect(onClose).toHaveBeenCalledOnce();
});

test("EditCardForm shows conflict copy and keeps the original title", async () => {
  const board = makeBoard();
  const onClose = vi.fn();
  vi.mocked(updateCardAction).mockResolvedValue({
    ok: false,
    error: "conflict",
  });

  const { user, queryClient, getByRole } = renderBoardForm(
    <EditCardForm
      boardId={board.id}
      card={firstCard(board)}
      onClose={onClose}
    />,
    { board },
  );
  const title = getByRole("textbox", { name: "Title" });

  await user.clear(title);
  await user.type(title, "Renamed");
  await user.click(getByRole("button", { name: "Save" }));

  await waitFor(() => {
    expect(getByRole("alert").textContent).toBe(
      "Someone else updated the board. Try again.",
    );
  });
  expect(cardsOf(queryClient, board.id, "column-1")[0]?.title).toBe(
    "Write tests",
  );
  expect(onClose).not.toHaveBeenCalled();
});
