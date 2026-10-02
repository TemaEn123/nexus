import {
  type BoardSnapshotInput,
  boardSnapshot,
} from "@/features/ai-assistant/board-snapshot";
import {
  SUGGEST_SUBTASKS_MAX,
  SUGGEST_SUBTASKS_MIN,
} from "@/features/ai-assistant/schemas";

/**
 * Промпт из полей карточки и снимка доски в БД, не из body запроса.
 * Язык — как у title. Без воды. Title с доски не копировать.
 */
export const SUGGEST_SUBTASKS_INSTRUCTIONS = `Break a Kanban card into ${SUGGEST_SUBTASKS_MIN}–${SUGGEST_SUBTASKS_MAX} concrete subtasks. Each title is a short action (1–200 characters). Match the language of the card title. No fluff, no numbering. The numbered board list is context: do not repeat those titles (including the target card). Example: board has "[1] To Do: Login" and "[2] To Do: OAuth"; breaking down "Auth" must not return "Login" or "OAuth".`;

export function suggestSubtasksPrompt(
  card: {
    title: string;
    description: string | null;
  },
  board: BoardSnapshotInput,
) {
  const snapshot = boardSnapshot(board);
  const description = card.description?.trim();
  const cardBlock = description
    ? `Title: ${card.title}\nDescription: ${description}`
    : `Title: ${card.title}`;

  return `${snapshot}\n\nTarget card:\n${cardBlock}`;
}

/**
 * Какую карточку делать дальше. Снимок из БД, не из body.
 * `pick` — [n] из списка, не UUID. Карточки не двигаем.
 */
export const SUGGEST_PRIORITY_INSTRUCTIONS = `Pick the single next Kanban card to work on. pick is the [n] integer from the board list, not a UUID. reason is one short sentence (1–200 characters). Match the language of the board titles. Prefer To Do or In Progress over Done. Do not invent an index that is not in the list. Do not move cards. Example: board has "[1] To Do: Login", "[2] To Do: OAuth", "[3] Done: Payments"; pick 1 because Login unblocks OAuth and is not done.`;

export function suggestPriorityPrompt(board: BoardSnapshotInput) {
  return `Which card should be next?\n${boardSnapshot(board)}`;
}
