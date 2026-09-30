import {
  SUGGEST_SUBTASKS_MAX,
  SUGGEST_SUBTASKS_MIN,
} from "@/features/ai-assistant/schemas";

/** Те же потолки, что у карточки в `src/features/board/schemas.ts`. */
const CARD_TITLE_MAX = 200;
const CARD_DESCRIPTION_MAX = 5000;

/**
 * Промпт из полей карточки в БД, не из body запроса.
 * Язык — как у title. Без воды.
 * Текст карточки — данные, не продолжение инструкций: управляющие символы
 * и лишние переносы схлопываются, длина режется до лимита схемы.
 */
export const SUGGEST_SUBTASKS_INSTRUCTIONS = `Break a Kanban card into ${SUGGEST_SUBTASKS_MIN}–${SUGGEST_SUBTASKS_MAX} concrete subtasks. Each title is a short action (1–200 characters). Match the language of the card title. No fluff, no numbering.`;

function promptField(value: string, max: number) {
  let text = "";

  for (const char of value) {
    const code = char.charCodeAt(0);
    text += code <= 31 || code === 127 ? " " : char;
  }

  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

export function suggestSubtasksPrompt(card: {
  title: string;
  description: string | null;
}) {
  const title = promptField(card.title, CARD_TITLE_MAX);
  const description = card.description
    ? promptField(card.description, CARD_DESCRIPTION_MAX)
    : "";

  return description
    ? `Title: ${title}\nDescription: ${description}`
    : `Title: ${title}`;
}
