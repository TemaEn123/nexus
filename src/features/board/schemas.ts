import { z } from "zod";

/**
 * Runtime-контракт body/params REST API канбана.
 *
 * Prisma даёт типы строк в БД; сюда приходит `unknown` из JSON/URL.
 * Без Zod опечатка `titel` или `{ title: "" }` дойдёт до insert.
 *
 * `z.strictObject` (Zod 4; `.strict()` deprecated): лишний ключ — ошибка,
 * а не молчаливый strip. Id родителя в body не принимаем — он в URL.
 */

/**
 * Id из динамического сегмента (`[boardId]` и т.д.).
 * Не проверяем формат cuid: достаточно непустой строки; отсутствие строки
 * в БД всё равно даст 404 в service.
 */
export const idSchema = z.string().min(1);

export const createBoardSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
});

/** Пока PATCH доски умеет только title — та же форма, что create. */
export const updateBoardSchema = createBoardSchema;

export const createColumnSchema = z.strictObject({
  title: z.string().trim().min(1).max(80),
});

/**
 * Частичный апдейт: хотя бы одно поле.
 * `position` — целое ≥ 0 (задел под reorder в М2).
 */
export const updateColumnSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(80).optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine(
    (value) => value.title !== undefined || value.position !== undefined,
    {
      error: "At least one field is required",
    },
  );

export const createCardSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  // Пустую строку в `null` нормализует service, не схема.
  description: z.string().trim().max(5000).optional(),
});

/**
 * `description: null` — очистить поле в БД.
 * `columnId` — перенос в другую колонку той же доски (проверка в service).
 */
export const updateCardSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    position: z.number().int().min(0).optional(),
    columnId: idSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.position !== undefined ||
      value.columnId !== undefined,
    { error: "At least one field is required" },
  );

export type CreateBoard = z.infer<typeof createBoardSchema>;
export type UpdateBoard = z.infer<typeof updateBoardSchema>;
export type CreateColumn = z.infer<typeof createColumnSchema>;
export type UpdateColumn = z.infer<typeof updateColumnSchema>;
export type CreateCard = z.infer<typeof createCardSchema>;
export type UpdateCard = z.infer<typeof updateCardSchema>;
