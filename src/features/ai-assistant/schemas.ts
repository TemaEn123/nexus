import { z } from "zod";
import { BOARD_SNAPSHOT_MAX_CARDS } from "@/features/ai-assistant/board-snapshot";

/** Сколько пунктов просим у модели. Дешёвый потолок стоимости. */
export const SUGGEST_SUBTASKS_MIN = 3;
export const SUGGEST_SUBTASKS_MAX = 7;

/** Одна фраза «почему эта карточка». */
export const SUGGEST_PRIORITY_REASON_MAX = 200;

/**
 * Ответ Suggest subtasks. Title как у карточки (1–200).
 * Клиент шлёт только `cardId` в URL; title/description для промпта — из БД.
 */
export const suggestSubtasksSchema = z.object({
  subtasks: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1)
          .max(200)
          .describe("Short action, no numbering"),
      }),
    )
    .min(SUGGEST_SUBTASKS_MIN)
    .max(SUGGEST_SUBTASKS_MAX),
});

export type SuggestSubtasks = z.infer<typeof suggestSubtasksSchema>;

/**
 * Ответ Suggest priority. `pick` — индекс из снимка доски, не UUID.
 * Клиент шлёт только `boardId` в URL; снимок — из БД.
 */
export const suggestPrioritySchema = z.object({
  pick: z
    .number()
    .int()
    .min(1)
    .max(BOARD_SNAPSHOT_MAX_CARDS)
    .describe("1-based index from the board list"),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(SUGGEST_PRIORITY_REASON_MAX)
    .describe("One short sentence, why this card is next"),
});

export type SuggestPriority = z.infer<typeof suggestPrioritySchema>;
