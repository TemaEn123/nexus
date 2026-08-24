import "server-only";

import type {
  CreateCard,
  UpdateCard,
  UpdateColumn,
} from "@/features/board/schemas";
import { ActivityType, Prisma } from "@/generated/prisma/client";
import { jsonError } from "@/server/api-response";
import { prisma } from "@/shared/lib/db";

/**
 * Доступ и CRUD канбана.
 *
 * Авторизация API — не «есть сессия», а `Board.ownerId === userId`.
 * Колонка и карточка своих `ownerId` не имеют: проверяем через связь
 * Card → Column → Board. Чужой id и несуществующий id выглядят одинаково
 * (404), чтобы не светить чужие доски.
 *
 * Route Handlers эти функции не дублируют: легко забыть проверку на
 * PATCH card с новым `columnId`.
 */

/** Пустая доска бесполезна для канбана; создаём сразу три колонки. */
const DEFAULT_COLUMN_TITLES = ["To Do", "In Progress", "Done"] as const;

/**
 * Одна форма для GET / POST / PATCH доски:
 * колонки и карточки сразу, оба списка по `position`.
 */
const boardDetailInclude = {
  columns: {
    orderBy: { position: "asc" as const },
    include: {
      cards: { orderBy: { position: "asc" as const } },
    },
  },
} satisfies Prisma.BoardInclude;

/** Клиент Prisma или `tx` из `$transaction` — одни и те же делегаты моделей. */
type Db = Pick<
  typeof prisma,
  "board" | "column" | "card" | "activityLog" | "$queryRaw"
>;

/**
 * Postgres unique не DEFERRABLE: нельзя одним UPDATE посадить соседа
 * на занятый слот. `-1` в колонке/доске свободен — позиции с API ≥ 0.
 */
const SENTINEL_POSITION = -1;

/**
 * Compact: сначала уводим все строки в свободный диапазон, потом 0..n−1.
 * Иначе промежуточный `position = i` пересечётся со старым значением.
 */
const POSITION_OFFSET = 1_000_000;

/**
 * Свой класс, не Prisma `P2025`: handler отличит «нет доступа» от сбоя БД
 * через `instanceof` и отдаст 404, а не 500.
 */
export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}

/** Unique `(boardId, position)` / `(columnId, position)` — гонка create. PATCH слот сам сдвигает. */
export class ConflictError extends Error {
  constructor() {
    super("Conflict");
    this.name = "ConflictError";
  }
}

function ownedOrThrow<T>(row: T | null): T {
  if (!row) {
    throw new NotFoundError();
  }

  return row;
}

/**
 * Гонка: запись исчезла между проверкой владения и мутацией.
 * P2025 — update/delete не нашли строку; P2003 — FK на уже удалённого родителя.
 */
function isMissingRecordError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2025" || error.code === "P2003")
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function rethrowAsConflict(error: unknown): never {
  if (isUniqueConstraintError(error)) {
    throw new ConflictError();
  }

  throw error;
}

/**
 * `undefined` — поле не прислали (не трогаем).
 * `""` и `null` — в БД пишем `null`, не пустую строку.
 */
function normalizeDescription(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "") {
    return null;
  }

  return value;
}

/** В лог только то, что реально пришло в PATCH. */
function cardUpdatedPayload(data: UpdateCard) {
  const payload: {
    title?: string;
    description?: string | null;
  } = {};

  if (data.title !== undefined) {
    payload.title = data.title;
  }

  if (data.description !== undefined) {
    payload.description = normalizeDescription(data.description) ?? null;
  }

  return payload;
}

/** Доска существует и принадлежит `userId`. */
export async function getOwnedBoard(
  userId: string,
  boardId: string,
  db: Db = prisma,
) {
  const board = await db.board.findFirst({
    // Один фильтр: нет отдельного findUnique, после которого светился бы 403.
    where: { id: boardId, ownerId: userId },
  });

  return ownedOrThrow(board);
}

/** Колонка на доске, которой владеет `userId`. */
export async function getOwnedColumn(
  userId: string,
  columnId: string,
  db: Db = prisma,
) {
  const column = await db.column.findFirst({
    where: {
      id: columnId,
      board: { ownerId: userId },
    },
  });

  return ownedOrThrow(column);
}

/**
 * Колонка на **конкретной** своей доске.
 * Нужна при переносе карточки: чужая колонка и колонка другой своей доски
 * в М1 — тоже 404 (между досками не переносим).
 */
export async function getOwnedColumnOnBoard(
  userId: string,
  columnId: string,
  boardId: string,
  db: Db = prisma,
) {
  const column = await db.column.findFirst({
    where: {
      id: columnId,
      boardId,
      board: { ownerId: userId },
    },
  });

  return ownedOrThrow(column);
}

/**
 * Карточка на своей доске.
 * `column.boardId` сразу в результате: PATCH с новым `columnId` сверит
 * целевую колонку через `getOwnedColumnOnBoard` без второго lookup доски.
 */
export async function getOwnedCard(
  userId: string,
  cardId: string,
  db: Db = prisma,
) {
  const card = await db.card.findFirst({
    where: {
      id: cardId,
      column: { board: { ownerId: userId } },
    },
    include: {
      column: { select: { boardId: true } },
    },
  });

  return ownedOrThrow(card);
}

function clampIndex(requested: number, maxInclusive: number) {
  if (maxInclusive < 0) {
    return 0;
  }

  return Math.min(Math.max(requested, 0), maxInclusive);
}

/**
 * Одна очередь на доску: create `max+1`, shift и compact не пересекаются.
 * `FOR UPDATE` на Board, не на Column — move карточки трогает две колонки,
 * два Column-lock в разном порядке дали бы deadlock.
 */
async function lockBoard(db: Db, boardId: string) {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Board" WHERE id = ${boardId} FOR UPDATE
  `;

  if (rows.length === 0) {
    throw new NotFoundError();
  }
}

async function compactCards(db: Db, columnId: string) {
  const cards = await db.card.findMany({
    where: { columnId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true, position: true },
  });

  if (cards.every((card, index) => card.position === index)) {
    return;
  }

  await db.card.updateMany({
    where: { columnId },
    data: { position: { increment: POSITION_OFFSET } },
  });

  for (const [index, card] of cards.entries()) {
    await db.card.update({
      where: { id: card.id },
      data: { position: index },
    });
  }
}

async function compactColumns(db: Db, boardId: string) {
  const columns = await db.column.findMany({
    where: { boardId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true, position: true },
  });

  if (columns.every((column, index) => column.position === index)) {
    return;
  }

  await db.column.updateMany({
    where: { boardId },
    data: { position: { increment: POSITION_OFFSET } },
  });

  for (const [index, column] of columns.entries()) {
    await db.column.update({
      where: { id: column.id },
      data: { position: index },
    });
  }
}

async function moveCard(
  db: Db,
  cardId: string,
  targetColumnId: string,
  requestedIndex: number,
) {
  const card = await db.card.findUnique({
    where: { id: cardId },
    select: { id: true, columnId: true },
  });

  if (!card) {
    throw new NotFoundError();
  }

  if (card.columnId === targetColumnId) {
    const siblings = await db.card.findMany({
      where: { columnId: card.columnId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const from = siblings.findIndex((row) => row.id === card.id);

    if (from === -1) {
      throw new NotFoundError();
    }

    const to = clampIndex(requestedIndex, siblings.length - 1);

    if (from === to) {
      return;
    }

    await db.card.update({
      where: { id: card.id },
      data: { position: SENTINEL_POSITION },
    });

    if (from < to) {
      for (const row of siblings.slice(from + 1, to + 1)) {
        await db.card.update({
          where: { id: row.id },
          data: { position: { decrement: 1 } },
        });
      }
    } else {
      for (const row of siblings.slice(to, from).toReversed()) {
        await db.card.update({
          where: { id: row.id },
          data: { position: { increment: 1 } },
        });
      }
    }

    await db.card.update({
      where: { id: card.id },
      data: { position: to },
    });
    return;
  }

  const sourceSiblings = await db.card.findMany({
    where: { columnId: card.columnId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const destSiblings = await db.card.findMany({
    where: { columnId: targetColumnId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const from = sourceSiblings.findIndex((row) => row.id === card.id);

  if (from === -1) {
    throw new NotFoundError();
  }

  const to = clampIndex(requestedIndex, destSiblings.length);

  await db.card.update({
    where: { id: card.id },
    data: { position: SENTINEL_POSITION },
  });

  for (const row of sourceSiblings.slice(from + 1)) {
    await db.card.update({
      where: { id: row.id },
      data: { position: { decrement: 1 } },
    });
  }

  for (const row of destSiblings.slice(to).toReversed()) {
    await db.card.update({
      where: { id: row.id },
      data: { position: { increment: 1 } },
    });
  }

  await db.card.update({
    where: { id: card.id },
    data: { columnId: targetColumnId, position: to },
  });
}

async function moveColumn(
  db: Db,
  boardId: string,
  columnId: string,
  requestedIndex: number,
) {
  const siblings = await db.column.findMany({
    where: { boardId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const from = siblings.findIndex((row) => row.id === columnId);

  if (from === -1) {
    throw new NotFoundError();
  }

  const to = clampIndex(requestedIndex, siblings.length - 1);

  if (from === to) {
    return;
  }

  await db.column.update({
    where: { id: columnId },
    data: { position: SENTINEL_POSITION },
  });

  if (from < to) {
    for (const row of siblings.slice(from + 1, to + 1)) {
      await db.column.update({
        where: { id: row.id },
        data: { position: { decrement: 1 } },
      });
    }
  } else {
    for (const row of siblings.slice(to, from).toReversed()) {
      await db.column.update({
        where: { id: row.id },
        data: { position: { increment: 1 } },
      });
    }
  }

  await db.column.update({
    where: { id: columnId },
    data: { position: to },
  });
}

/**
 * `NotFoundError` и Prisma «строки уже нет» → 404 JSON.
 * Гонка unique position (P2002) → 409, не 500. Стек Prisma клиенту не отдаём.
 * Занятый индекс на PATCH сюда не должен попадать — `updateCard`/`updateColumn` делают shift.
 */
export function handleBoardError(error: unknown) {
  if (error instanceof NotFoundError || isMissingRecordError(error)) {
    return jsonError(404, "not_found", "Not found");
  }

  if (error instanceof ConflictError || isUniqueConstraintError(error)) {
    return jsonError(409, "conflict", "This slot is taken. Try again.");
  }

  console.error(error);
  return jsonError(500, "internal", "Something went wrong");
}

/** Список своих досок без колонок — для будущего dashboard. */
export async function listBoards(userId: string) {
  return prisma.board.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { columns: true } },
    },
  });
}

/** Доска с колонками и карточками; иначе `NotFoundError`. */
export async function getBoard(userId: string, boardId: string) {
  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: userId },
    include: boardDetailInclude,
  });

  return ownedOrThrow(board);
}

/**
 * Доска + три колонки + `BOARD_CREATED` в одной транзакции.
 * Без транзакции клиент мог бы получить доску без колонок при сбое на середине.
 * `BOARD_DELETED` не пишем: ActivityLog каскадом уйдёт вместе с доской.
 */
export async function createBoard(userId: string, title: string) {
  return prisma.$transaction(async (tx) => {
    const board = await tx.board.create({
      data: { title, ownerId: userId },
    });

    await tx.column.createMany({
      data: DEFAULT_COLUMN_TITLES.map((columnTitle, position) => ({
        title: columnTitle,
        position,
        boardId: board.id,
      })),
    });

    await tx.activityLog.create({
      data: {
        type: ActivityType.BOARD_CREATED,
        userId,
        boardId: board.id,
        payload: { title },
      },
    });

    return tx.board.findUniqueOrThrow({
      where: { id: board.id },
      include: boardDetailInclude,
    });
  });
}

export async function updateBoard(
  userId: string,
  boardId: string,
  title: string,
) {
  const result = await prisma.board.updateMany({
    where: { id: boardId, ownerId: userId },
    data: { title },
  });

  if (result.count === 0) {
    throw new NotFoundError();
  }

  return getBoard(userId, boardId);
}

/** Каскад снимет колонки, карточки и логи доски. */
export async function deleteBoard(userId: string, boardId: string) {
  const result = await prisma.board.deleteMany({
    where: { id: boardId, ownerId: userId },
  });

  if (result.count === 0) {
    throw new NotFoundError();
  }

  return { id: boardId };
}

/**
 * Новая колонка в конец доски (`max(position) + 1`).
 * Владение, lock, max и create в одной транзакции: доска не успеет исчезнуть
 * между проверкой и insert (иначе был бы P2003 → 500).
 */
export async function createColumn(
  userId: string,
  boardId: string,
  title: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await getOwnedBoard(userId, boardId, tx);
      await lockBoard(tx, boardId);

      const aggregated = await tx.column.aggregate({
        where: { boardId },
        _max: { position: true },
      });

      const column = await tx.column.create({
        data: {
          title,
          boardId,
          position: (aggregated._max.position ?? -1) + 1,
        },
      });

      await tx.activityLog.create({
        data: {
          type: ActivityType.COLUMN_CREATED,
          userId,
          boardId,
          payload: { title },
        },
      });

      return column;
    });
  } catch (error) {
    rethrowAsConflict(error);
  }
}

/** `undefined` в Prisma update значит «поле не трогать». Position — только через shift. */
export async function updateColumn(
  userId: string,
  columnId: string,
  data: UpdateColumn,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const column = await getOwnedColumn(userId, columnId, tx);

      if (data.position !== undefined) {
        await lockBoard(tx, column.boardId);
        const fresh = await tx.column.findUniqueOrThrow({
          where: { id: column.id },
          select: { id: true, boardId: true, position: true },
        });

        if (data.position !== fresh.position) {
          await moveColumn(tx, fresh.boardId, fresh.id, data.position);
        }
      }

      if (data.title !== undefined) {
        await tx.column.update({
          where: { id: columnId },
          data: { title: data.title },
        });
      }

      return tx.column.findUniqueOrThrow({ where: { id: columnId } });
    });
  } catch (error) {
    rethrowAsConflict(error);
  }
}

/** Карточки колонки уйдут каскадом. `COLUMN_DELETED` не пишем — лог снесётся вместе с доской/FK. */
export async function deleteColumn(userId: string, columnId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const column = await getOwnedColumn(userId, columnId, tx);
      await lockBoard(tx, column.boardId);
      await tx.column.delete({ where: { id: column.id } });
      await compactColumns(tx, column.boardId);
      return { id: columnId };
    });
  } catch (error) {
    rethrowAsConflict(error);
  }
}

/**
 * Карточка в конец колонки. Проверка колонки и insert в одной транзакции.
 */
export async function createCard(
  userId: string,
  columnId: string,
  data: CreateCard,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const column = await getOwnedColumn(userId, columnId, tx);
      await lockBoard(tx, column.boardId);

      const aggregated = await tx.card.aggregate({
        where: { columnId },
        _max: { position: true },
      });

      const card = await tx.card.create({
        data: {
          title: data.title,
          description: normalizeDescription(data.description) ?? null,
          columnId,
          position: (aggregated._max.position ?? -1) + 1,
        },
      });

      await tx.activityLog.create({
        data: {
          type: ActivityType.CARD_CREATED,
          userId,
          boardId: column.boardId,
          cardId: card.id,
          payload: { title: data.title },
        },
      });

      return card;
    });
  } catch (error) {
    rethrowAsConflict(error);
  }
}

/**
 * PATCH карточки. Новый `columnId` обязан быть на той же доске.
 * Смена колонки или `position` → shift в той же tx, не голая запись слота.
 * Индекс больше длины списка — в конец. Смена колонки без `position` — тоже в конец.
 * `CARD_MOVED`, иначе `CARD_UPDATED`.
 */
export async function updateCard(
  userId: string,
  cardId: string,
  data: UpdateCard,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const card = await getOwnedCard(userId, cardId, tx);
      const boardId = card.column.boardId;
      const targetColumnId = data.columnId ?? card.columnId;

      if (targetColumnId !== card.columnId) {
        await getOwnedColumnOnBoard(userId, targetColumnId, boardId, tx);
      }

      const wantsMove =
        data.columnId !== undefined || data.position !== undefined;
      let moving = false;

      if (wantsMove) {
        await lockBoard(tx, boardId);
        const fresh = await tx.card.findUniqueOrThrow({
          where: { id: card.id },
          select: { columnId: true, position: true },
        });
        const nextColumnId = data.columnId ?? fresh.columnId;
        moving =
          nextColumnId !== fresh.columnId ||
          (data.position !== undefined && data.position !== fresh.position);

        if (moving) {
          await moveCard(
            tx,
            card.id,
            nextColumnId,
            data.position ?? Number.MAX_SAFE_INTEGER,
          );
        }
      }

      const updated =
        data.title !== undefined || data.description !== undefined
          ? await tx.card.update({
              where: { id: cardId },
              data: {
                title: data.title,
                description: normalizeDescription(data.description),
              },
            })
          : await tx.card.findUniqueOrThrow({ where: { id: cardId } });

      await tx.activityLog.create({
        data: {
          type: moving ? ActivityType.CARD_MOVED : ActivityType.CARD_UPDATED,
          userId,
          boardId,
          cardId,
          payload: moving
            ? { columnId: updated.columnId, position: updated.position }
            : cardUpdatedPayload(data),
        },
      });

      return updated;
    });
  } catch (error) {
    rethrowAsConflict(error);
  }
}

/**
 * Лог пишем до delete: у ActivityLog.cardId стоит `onDelete: SetNull`,
 * строка лога останется, ссылка на карточку обнулится.
 */
export async function deleteCard(userId: string, cardId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const card = await getOwnedCard(userId, cardId, tx);
      await lockBoard(tx, card.column.boardId);

      await tx.activityLog.create({
        data: {
          type: ActivityType.CARD_DELETED,
          userId,
          boardId: card.column.boardId,
          cardId: card.id,
          payload: { title: card.title },
        },
      });
      await tx.card.delete({ where: { id: card.id } });
      await compactCards(tx, card.columnId);
    });

    return { id: cardId };
  } catch (error) {
    rethrowAsConflict(error);
  }
}
