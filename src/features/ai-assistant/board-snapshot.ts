/** Сколько карточек в промпт. Дальше — токены зря. */
export const BOARD_SNAPSHOT_MAX_CARDS = 40;

/** Title доски / колонки / карточки в одной строке. */
export const BOARD_SNAPSHOT_TITLE_MAX = 80;

export type BoardSnapshotInput = {
  title: string;
  columns: ReadonlyArray<{
    title: string;
    cards: ReadonlyArray<{ title: string }>;
  }>;
};

function clipTitle(value: string) {
  const title = value.trim();
  return title.length <= BOARD_SNAPSHOT_TITLE_MAX
    ? title
    : title.slice(0, BOARD_SNAPSHOT_TITLE_MAX);
}

export function boardCardCount(board: BoardSnapshotInput): number {
  return board.columns.reduce((sum, column) => sum + column.cards.length, 0);
}

/**
 * Компактный список для LLM: индекс + колонка + title.
 * UUID и description не кладём. Порядок — колонки, затем карточки как в `getBoard`.
 */
export function boardSnapshot(board: BoardSnapshotInput): string {
  const header = `Board: ${clipTitle(board.title) || "Untitled"}`;
  const lines: string[] = [];

  for (const column of board.columns) {
    const columnTitle = clipTitle(column.title) || "Untitled";

    for (const card of column.cards) {
      if (lines.length >= BOARD_SNAPSHOT_MAX_CARDS) {
        break;
      }

      const cardTitle = clipTitle(card.title) || "Untitled";
      lines.push(`[${lines.length + 1}] ${columnTitle}: ${cardTitle}`);
    }

    if (lines.length >= BOARD_SNAPSHOT_MAX_CARDS) {
      break;
    }
  }

  if (lines.length === 0) {
    return `${header}\n(no cards)`;
  }

  const cardCount = boardCardCount(board);
  const omitted = cardCount - lines.length;
  const body = lines.join("\n");

  if (omitted > 0) {
    return `${header}\n${body}\n(+${omitted} omitted)`;
  }

  return `${header}\n${body}`;
}

/**
 * `pick` из ответа модели → id карточки. Тот же обход, что `boardSnapshot`
 * (колонки, затем карточки, потолок 40). Иначе UI подсветит не то, что видела LLM.
 */
export function cardIdAtPick(
  board: {
    columns: ReadonlyArray<{
      cards: ReadonlyArray<{ id: string }>;
    }>;
  },
  pick: number,
): string | undefined {
  if (!Number.isInteger(pick) || pick < 1) {
    return undefined;
  }

  let index = 0;

  for (const column of board.columns) {
    for (const card of column.cards) {
      index += 1;

      if (index === pick) {
        return card.id;
      }

      if (index >= BOARD_SNAPSHOT_MAX_CARDS) {
        return undefined;
      }
    }
  }

  return undefined;
}
