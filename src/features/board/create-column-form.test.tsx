import type { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { expect, test } from "vitest";
import { CreateColumnForm } from "@/features/board/create-column-form";
import { isTempId } from "@/features/board/temp-id";
import type { BoardDetail } from "@/features/board/types";
import { boardKeys } from "@/shared/api/query-keys";
import { TEST_ORIGIN } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderBoardForm } from "@/test/render-board";

function columnsOf(queryClient: QueryClient, boardId: string) {
  return (
    queryClient.getQueryData<BoardDetail>(boardKeys.detail(boardId))?.columns ??
    []
  );
}

test("CreateColumnForm rejects a blank title without fetching", async () => {
  let posted = false;
  server.use(
    http.post(`${TEST_ORIGIN}/api/boards/:boardId/columns`, () => {
      posted = true;
      return HttpResponse.json(
        { error: { code: "internal", message: "nope" } },
        { status: 500 },
      );
    }),
  );

  const { user, queryClient, board, getByRole } = renderBoardForm(
    <CreateColumnForm boardId="board-1" />,
  );

  await user.type(getByRole("textbox", { name: "New column" }), "   ");
  await user.click(getByRole("button", { name: "Add column" }));

  expect(posted).toBe(false);
  expect(getByRole("alert").textContent).toBe(
    "Column title is required (1–80 characters).",
  );
  expect(columnsOf(queryClient, board.id)).toHaveLength(2);
});

test("CreateColumnForm POSTs title only and replaces temp id with the 201 column", async () => {
  const { user, queryClient, board, getByRole } = renderBoardForm(
    <CreateColumnForm boardId="board-1" />,
  );
  const input = getByRole("textbox", { name: "New column" });

  await user.type(input, "Review");
  await user.click(getByRole("button", { name: "Add column" }));

  await waitFor(() => {
    const last = columnsOf(queryClient, board.id).at(-1);
    expect(last).toMatchObject({
      id: "column-msw",
      title: "Review",
      boardId: "board-1",
      cards: [],
    });
    expect(isTempId(last?.id ?? "temp-x")).toBe(false);
  });
  expect(input).toHaveProperty("value", "");
});

test("CreateColumnForm shows conflict copy and keeps columns on 409", async () => {
  server.use(
    http.post(`${TEST_ORIGIN}/api/boards/:boardId/columns`, () =>
      HttpResponse.json(
        {
          error: {
            code: "conflict",
            message: "This slot is taken. Try again.",
          },
        },
        { status: 409 },
      ),
    ),
  );

  const { user, queryClient, board, getByRole } = renderBoardForm(
    <CreateColumnForm boardId="board-1" />,
  );
  const snapshot = columnsOf(queryClient, board.id);

  await user.type(getByRole("textbox", { name: "New column" }), "Review");
  await user.click(getByRole("button", { name: "Add column" }));

  await waitFor(() => {
    expect(getByRole("alert").textContent).toBe(
      "Someone else updated the board. Try again.",
    );
  });
  expect(columnsOf(queryClient, board.id)).toEqual(snapshot);
});
