import type { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, expect, test, vi } from "vitest";
import { KanbanColumn } from "@/app/dashboard/[boardId]/_ui/kanban-column";
import { makeBoard, makeColumn } from "@/features/board/board-fixture";
import type { BoardDetail } from "@/features/board/types";
import { boardKeys } from "@/shared/api/query-keys";
import { TEST_ORIGIN } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderBoardForm } from "@/test/render-board";

vi.mock("@dnd-kit/react", () => ({
  useDroppable: () => ({ isDropTarget: false, ref: () => {} }),
}));

vi.mock("@/app/dashboard/[boardId]/_ui/kanban-card", () => ({
  KanbanCard: () => null,
}));

vi.mock("@/features/board/create-card-form", () => ({
  CreateCardForm: () => null,
}));

function columnsOf(queryClient: QueryClient, boardId: string) {
  return (
    queryClient.getQueryData<BoardDetail>(boardKeys.detail(boardId))?.columns ??
    []
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

function firstColumn(board: BoardDetail) {
  const column = board.columns[0];
  if (!column) {
    throw new Error("makeBoard fixture must include a column");
  }
  return column;
}

test("KanbanColumn delete cancel does not call DELETE", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  let deleted = false;
  server.use(
    http.delete(`${TEST_ORIGIN}/api/columns/:columnId`, () => {
      deleted = true;
      return HttpResponse.json({ data: { id: "column-1" } });
    }),
  );

  const board = makeBoard();
  const { user, queryClient, getByRole } = renderBoardForm(
    <KanbanColumn boardId={board.id} column={firstColumn(board)} />,
    { board },
  );

  await user.click(getByRole("button", { name: "Delete column To Do" }));

  expect(deleted).toBe(false);
  expect(columnsOf(queryClient, board.id).map((column) => column.id)).toEqual([
    "column-1",
    "column-2",
  ]);
});

test("KanbanColumn delete OK removes the column via DELETE", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const board = makeBoard();
  const { user, queryClient, getByRole } = renderBoardForm(
    <KanbanColumn boardId={board.id} column={firstColumn(board)} />,
    { board },
  );

  await user.click(getByRole("button", { name: "Delete column To Do" }));

  await waitFor(() => {
    expect(columnsOf(queryClient, board.id).map((column) => column.id)).toEqual(
      ["column-2"],
    );
  });
});

test("KanbanColumn delete error restores the column", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.delete(`${TEST_ORIGIN}/api/columns/:columnId`, () =>
      HttpResponse.json(
        { error: { code: "internal", message: "fail" } },
        { status: 500 },
      ),
    ),
  );

  const board = makeBoard();
  const { user, queryClient, getByRole } = renderBoardForm(
    <KanbanColumn boardId={board.id} column={firstColumn(board)} />,
    { board },
  );

  await user.click(getByRole("button", { name: "Delete column To Do" }));

  await waitFor(() => {
    expect(getByRole("alert").textContent).toBe(
      "Something went wrong. Try again.",
    );
  });
  expect(columnsOf(queryClient, board.id).map((column) => column.id)).toEqual([
    "column-1",
    "column-2",
  ]);
});

test("temp column has no delete button", () => {
  const column = makeColumn({ id: "temp-1", title: "Incoming" });
  const board = makeBoard({ columns: [column] });
  const { queryByRole } = renderBoardForm(
    <KanbanColumn boardId={board.id} column={column} />,
    { board },
  );

  expect(queryByRole("button", { name: "Delete column Incoming" })).toBeNull();
});
