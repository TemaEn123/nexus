import "server-only";

import { z } from "zod";

/**
 * Общий JSON-контракт Route Handlers канбана.
 *
 * Успех всегда `{ data }`, ошибка всегда `{ error: { code, message, details? } }`.
 * Клиенту (позже TanStack Query) не нужно угадывать форму ответа на каждом URL.
 *
 * Файл в `src/server/`: только сервер (чтение body, без UI). `server-only`
 * не даст случайно импортировать это в Client Component.
 */

/** Стабильные коды для ветвления на клиенте; текст `message` можно менять. */
export type ApiErrorCode =
  | "unauthorized"
  | "validation_error"
  | "not_found"
  | "internal";

type ParseSuccess<T> = { ok: true; data: T };
type ParseFailure = { ok: false; response: Response };

/**
 * 2xx: оборачиваем полезную нагрузку в `{ data }`.
 * `status` по умолчанию 200; для POST передаём 201.
 */
export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

/**
 * 4xx/5xx: одна и та же форма, чтобы фронт не парсил то HTML, то JSON.
 * `details` — опционально (например flatten Zod); наружу не кладём стек Prisma.
 */
export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
) {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );
}

/**
 * Читает JSON body и прогоняет через Zod.
 *
 * Не бросает: Route Handler должен вернуть 400, а не упасть в 500.
 * Результат — discriminated union: либо данные с типом схемы, либо готовый
 * `Response` (битый JSON или невалидные поля).
 *
 * `z.flattenError` (Zod 4) даёт `{ formErrors, fieldErrors }`, а не сырой
 * ZodError — клиенту проще показать ошибку у конкретного поля.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ParseSuccess<z.infer<T>> | ParseFailure> {
  let raw: unknown;

  try {
    // `request.json()` бросает, если тело пустое или не JSON.
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: jsonError(400, "validation_error", "Invalid JSON body"),
    };
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        400,
        "validation_error",
        "Invalid request body",
        z.flattenError(parsed.error),
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Id из URL (`[boardId]`, `[columnId]`, `[cardId]`).
 * Тот же union, что у `parseBody`: `if (!path.ok) return path.response`.
 * Схему передаём снаружи (`idSchema`), чтобы контракт id жил в одном месте.
 */
export function parseIdParam<T extends z.ZodType>(
  id: string,
  schema: T,
): ParseSuccess<z.infer<T>> | ParseFailure {
  const parsed = schema.safeParse(id);

  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(400, "validation_error", "Invalid id"),
    };
  }

  return { ok: true, data: parsed.data };
}
