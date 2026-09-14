import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { makeBoard } from "@/features/board/board-fixture";
import type { BoardDetail } from "@/features/board/types";
import {
  BoardOptimisticProvider,
  useBoardOptimistic,
} from "@/features/board/use-board-optimistic";
import { boardKeys } from "@/shared/api/query-keys";

/**
 * Кэш уже заполнен: staleTime Infinity, чтобы useQuery не бил GET /api/boards/:id
 * (этого хендлера в MSW нет — колонки идут POST/DELETE).
 */
export function createFormQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
        staleTime: Number.POSITIVE_INFINITY,
      },
      mutations: { retry: false },
    },
  });
}

function BoardFormTree({
  boardId,
  children,
}: {
  boardId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: board } = useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => {
      const current = queryClient.getQueryData<BoardDetail>(
        boardKeys.detail(boardId),
      );
      if (!current) {
        throw new Error("Board must be seeded with setQueryData");
      }
      return current;
    },
  });
  const [optimisticBoard, apply] = useBoardOptimistic(board);

  return (
    <BoardOptimisticProvider apply={apply}>
      <OptimisticCardsProbe board={optimisticBoard} />
      {children}
    </BoardOptimisticProvider>
  );
}

/** Overlay `useOptimistic`, не Query. `hidden` — не путает getByRole. */
function OptimisticCardsProbe({ board }: { board: BoardDetail | undefined }) {
  if (!board) {
    return null;
  }

  return (
    <ul data-testid="optimistic-cards" hidden>
      {board.columns.flatMap((column) =>
        column.cards.map((card) => (
          <li
            data-card-id={card.id}
            data-column-id={column.id}
            key={`${column.id}:${card.id}`}
          >
            {card.title}
          </li>
        )),
      )}
    </ul>
  );
}

export function readOptimisticCards(list: HTMLElement) {
  return [...list.querySelectorAll("[data-card-id]")].map((node) => ({
    id: node.getAttribute("data-card-id") ?? "",
    columnId: node.getAttribute("data-column-id") ?? "",
    title: node.textContent ?? "",
  }));
}

export function renderBoardForm(
  ui: ReactNode,
  options?: { board?: BoardDetail },
) {
  const board = options?.board ?? makeBoard();
  const queryClient = createFormQueryClient();
  queryClient.setQueryData(boardKeys.detail(board.id), board);

  const view = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BoardFormTree boardId={board.id}>{children}</BoardFormTree>
      </QueryClientProvider>
    ),
  });

  return { user: userEvent.setup(), queryClient, board, ...view };
}
