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
type Db = Pick<typeof prisma, "board" | "column" | "card" | "activityLog">;

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

/**
 * `NotFoundError` и Prisma «строки уже нет» → 404 JSON.
 * Остальное логируем и прячем (стек Prisma клиенту не нужен).
 */
export function handleBoardError(error: unknown) {
  if (error instanceof NotFoundError || isMissingRecordError(error)) {
    return jsonError(404, "not_found", "Not found");
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
 * Владение, max и create в одной транзакции: доска не успеет исчезнуть
 * между проверкой и insert (иначе был бы P2003 → 500).
 */
export async function createColumn(
  userId: string,
  boardId: string,
  title: string,
) {
  return prisma.$transaction(async (tx) => {
    await getOwnedBoard(userId, boardId, tx);

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
}

/** `undefined` в Prisma update значит «поле не трогать». */
export async function updateColumn(
  userId: string,
  columnId: string,
  data: UpdateColumn,
) {
  const result = await prisma.column.updateMany({
    where: { id: columnId, board: { ownerId: userId } },
    data: {
      title: data.title,
      position: data.position,
    },
  });

  if (result.count === 0) {
    throw new NotFoundError();
  }

  return prisma.column.findUniqueOrThrow({ where: { id: columnId } });
}

/** Карточки колонки уйдут каскадом. `COLUMN_DELETED` не пишем — лог снесётся вместе с доской/FK. */
export async function deleteColumn(userId: string, columnId: string) {
  const result = await prisma.column.deleteMany({
    where: { id: columnId, board: { ownerId: userId } },
  });

  if (result.count === 0) {
    throw new NotFoundError();
  }

  return { id: columnId };
}

/**
 * Карточка в конец колонки. Проверка колонки и insert в одной транзакции.
 */
export async function createCard(
  userId: string,
  columnId: string,
  data: CreateCard,
) {
  return prisma.$transaction(async (tx) => {
    const column = await getOwnedColumn(userId, columnId, tx);

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
}

/**
 * PATCH карточки. Новый `columnId` обязан быть на той же доске.
 * Смена колонки или `position` → `CARD_MOVED`, иначе `CARD_UPDATED`.
 */
export async function updateCard(
  userId: string,
  cardId: string,
  data: UpdateCard,
) {
  return prisma.$transaction(async (tx) => {
    const card = await getOwnedCard(userId, cardId, tx);
    const boardId = card.column.boardId;

    if (data.columnId !== undefined && data.columnId !== card.columnId) {
      await getOwnedColumnOnBoard(userId, data.columnId, boardId, tx);
    }

    const moved =
      (data.columnId !== undefined && data.columnId !== card.columnId) ||
      (data.position !== undefined && data.position !== card.position);

    const updated = await tx.card.update({
      where: { id: cardId },
      data: {
        title: data.title,
        description: normalizeDescription(data.description),
        position: data.position,
        columnId: data.columnId,
      },
    });

    await tx.activityLog.create({
      data: {
        type: moved ? ActivityType.CARD_MOVED : ActivityType.CARD_UPDATED,
        userId,
        boardId,
        cardId,
        payload: moved
          ? { columnId: updated.columnId, position: updated.position }
          : cardUpdatedPayload(data),
      },
    });

    return updated;
  });
}

/**
 * Лог пишем до delete: у ActivityLog.cardId стоит `onDelete: SetNull`,
 * строка лога останется, ссылка на карточку обнулится.
 */
export async function deleteCard(userId: string, cardId: string) {
  await prisma.$transaction(async (tx) => {
    const card = await getOwnedCard(userId, cardId, tx);

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
  });

  return { id: cardId };
}
