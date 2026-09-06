import { z } from "zod";

/** Сколько пунктов просим у модели. Дешёвый потолок стоимости. */
export const SUGGEST_SUBTASKS_MIN = 3;
export const SUGGEST_SUBTASKS_MAX = 7;

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
