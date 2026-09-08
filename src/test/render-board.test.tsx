import { expect, test } from "vitest";
import { useApplyBoardOptimistic } from "@/features/board/use-board-optimistic";
import { boardKeys } from "@/shared/api/query-keys";
import { readOptimisticCards, renderBoardForm } from "@/test/render-board";

function Probe() {
  useApplyBoardOptimistic();
  return <p>ready</p>;
}

test("renderBoardForm seeds Query cache and provides optimistic apply", () => {
  const { queryClient, board, getByText, getByTestId } = renderBoardForm(
    <Probe />,
  );

  expect(queryClient.getQueryData(boardKeys.detail(board.id))).toEqual(board);
  expect(getByText("ready")).toBeDefined();
  expect(readOptimisticCards(getByTestId("optimistic-cards"))).toMatchObject([
    { id: "card-1", title: "Write tests", columnId: "column-1" },
  ]);
});
