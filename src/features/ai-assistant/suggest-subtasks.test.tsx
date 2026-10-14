import { afterEach, expect, test, vi } from "vitest";
import { SuggestSubtasks } from "@/features/ai-assistant/suggest-subtasks";
import { makeBoard } from "@/features/board/board-fixture";
import { renderBoardForm } from "@/test/render-board";

const suggestApi = vi.hoisted(() => ({
  subtasks: undefined as { title: string }[] | undefined,
  isLoading: false,
  error: undefined as string | undefined,
  empty: false,
  suggest: vi.fn(),
  stop: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("@/features/board/actions", () => ({
  createCardAction: vi.fn(),
}));

vi.mock("@/features/ai-assistant/use-suggest-subtasks", () => ({
  useSuggestSubtasks: () => ({
    subtasks: suggestApi.subtasks,
    isLoading: suggestApi.isLoading,
    error: suggestApi.error,
    empty: suggestApi.empty,
    suggest: suggestApi.suggest,
    stop: suggestApi.stop,
    clear: suggestApi.clear,
  }),
}));

afterEach(() => {
  suggestApi.subtasks = undefined;
  suggestApi.isLoading = false;
  suggestApi.error = undefined;
  suggestApi.empty = false;
  vi.clearAllMocks();
});

function renderSuggest() {
  const board = makeBoard();
  const card = board.columns[0]?.cards[0];
  if (!card) {
    throw new Error("makeBoard fixture must include a card");
  }

  return renderBoardForm(
    <SuggestSubtasks
      boardId={board.id}
      cardId={card.id}
      cardTitle={card.title}
      columnId={card.columnId}
    />,
    { board },
  );
}

test("SuggestSubtasks Stop while loading does not show an alert", () => {
  suggestApi.isLoading = true;
  const { getByRole, queryByRole } = renderSuggest();

  getByRole("button", { name: /Stop suggesting subtasks/ }).click();
  expect(suggestApi.stop).toHaveBeenCalledTimes(1);
  expect(queryByRole("alert")).toBeNull();
});

test("SuggestSubtasks Stop does not show an alert for a partial list", () => {
  suggestApi.isLoading = false;
  suggestApi.subtasks = [{ title: "Draft API" }];

  const { getByText, queryByRole } = renderSuggest();

  expect(getByText("Draft API")).toBeTruthy();
  expect(queryByRole("alert")).toBeNull();
  expect(queryByRole("button", { name: "Retry" })).toBeNull();
});

test("SuggestSubtasks shows No suggestions and Retry without an alert", () => {
  suggestApi.empty = true;
  const onRetry = suggestApi.suggest;
  const { getByText, getByRole, queryByRole } = renderSuggest();

  expect(getByText("No suggestions")).toBeTruthy();
  expect(queryByRole("alert")).toBeNull();
  getByRole("button", { name: "Retry" }).click();
  expect(onRetry).toHaveBeenCalledTimes(1);
});
