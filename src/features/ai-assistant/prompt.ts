import {
  SUGGEST_SUBTASKS_MAX,
  SUGGEST_SUBTASKS_MIN,
} from "@/features/ai-assistant/schemas";

/**
 * Промпт из полей карточки в БД, не из body запроса.
 * Язык — как у title. Без воды.
 */
export const SUGGEST_SUBTASKS_INSTRUCTIONS = `Break a Kanban card into ${SUGGEST_SUBTASKS_MIN}–${SUGGEST_SUBTASKS_MAX} concrete subtasks. Each title is a short action (1–200 characters). Match the language of the card title. No fluff, no numbering.`;

export function suggestSubtasksPrompt(card: {
  title: string;
  description: string | null;
}) {
  const description = card.description?.trim();

  return description
    ? `Title: ${card.title}\nDescription: ${description}`
    : `Title: ${card.title}`;
}
