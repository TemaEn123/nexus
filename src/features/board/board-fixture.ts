import type {
  BoardCard,
  BoardColumn,
  BoardDetail,
} from "@/features/board/types";

/**
 * Клиентский снимок доски для unit-тестов (Query-кэш, optimistic).
 * Даты — ISO-строки, как после `toBoardDto` / REST, не Prisma `Date`.
 */

const FIXTURE_ISO = "2026-01-15T12:00:00.000Z";

type CardSeed = Partial<BoardCard>;
type ColumnSeed = Partial<Omit<BoardColumn, "cards">> & { cards?: CardSeed[] };
type BoardSeed = Partial<Omit<BoardDetail, "columns">> & {
  columns?: ColumnSeed[];
};

export function makeCard(seed: CardSeed = {}): BoardCard {
  return {
    id: "card-1",
    title: "Card",
    description: null,
    position: 0,
    columnId: "column-1",
    createdAt: FIXTURE_ISO,
    updatedAt: FIXTURE_ISO,
    ...seed,
  };
}

export function makeColumn(seed: ColumnSeed = {}): BoardColumn {
  const { cards: cardSeeds, ...column } = seed;
  const id = column.id ?? "column-1";

  return {
    id,
    title: "To Do",
    position: 0,
    boardId: "board-1",
    createdAt: FIXTURE_ISO,
    updatedAt: FIXTURE_ISO,
    ...column,
    cards: (cardSeeds ?? []).map((card, position) =>
      makeCard({
        id: `card-${position + 1}`,
        title: `Card ${position + 1}`,
        position,
        columnId: id,
        ...card,
      }),
    ),
  };
}

const DEFAULT_COLUMNS: ColumnSeed[] = [
  {
    id: "column-1",
    title: "To Do",
    cards: [{ id: "card-1", title: "Write tests" }],
  },
  { id: "column-2", title: "In Progress", cards: [] },
];

export function makeBoard(seed: BoardSeed = {}): BoardDetail {
  const { columns: columnSeeds, ...board } = seed;
  const id = board.id ?? "board-1";

  return {
    id,
    title: "Sprint",
    ownerId: "user-1",
    createdAt: FIXTURE_ISO,
    updatedAt: FIXTURE_ISO,
    ...board,
    columns: (columnSeeds ?? DEFAULT_COLUMNS).map((column, position) =>
      makeColumn({
        id: `column-${position + 1}`,
        title: `Column ${position + 1}`,
        position,
        boardId: id,
        ...column,
      }),
    ),
  };
}
