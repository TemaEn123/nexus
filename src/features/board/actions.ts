"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  createBoardSchema,
  createCardSchema,
  createColumnSchema,
  idSchema,
  moveCardSchema,
  updateCardContentSchema,
} from "@/features/board/schemas";
import {
  ConflictError,
  createBoard,
  createCard,
  createColumn,
  deleteBoard,
  deleteCard,
  deleteColumn,
  NotFoundError,
  updateCard,
} from "@/features/board/service";
import type { BoardCard } from "@/features/board/types";
import { requireUser } from "@/server/require-user";
import { toCardDto } from "@/shared/api/board";

/**
 * Server Actions дашборда. Формы зовут эти функции, не `/api/boards`.
 * Prisma сюда не импортируем — владение и запись в `service.ts`.
 *
 * `redirect` / `notFound` бросают (так Next.js делает навигацию).
 * Их нельзя глотать: снаружи try, либо после узкого `catch` как в auth.
 * Карточки (create/update/delete) и DnD (`moveCardAction`) не редиректят:
 * клиенту нужен `{ ok }` для optimistic UI, без вспышки страницы.
 */

export type BoardActionError = "conflict" | "not-found" | "invalid";

export type MoveCardResult =
  | { ok: true }
  | { ok: false; error: BoardActionError };

export type CardWriteResult =
  | { ok: true; card: BoardCard }
  | { ok: false; error: BoardActionError };

export type DeleteCardResult =
  | { ok: true }
  | { ok: false; error: BoardActionError };

export async function createBoardAction(formData: FormData) {
  const user = await requireUser();

  const parsed = createBoardSchema.safeParse({
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid");
  }

  const board = await createBoard(user.id, parsed.data.title);

  revalidatePath("/dashboard");
  redirect(`/dashboard/${board.id}`);
}

export async function deleteBoardAction(formData: FormData) {
  const user = await requireUser();

  const parsed = idSchema.safeParse(formData.get("boardId"));

  if (!parsed.success) {
    notFound();
  }

  try {
    await deleteBoard(user.id, parsed.data);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function revalidateBoard(boardId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${boardId}`);
}

function refreshBoard(boardId: string): never {
  revalidateBoard(boardId);
  redirect(`/dashboard/${boardId}`);
}

export async function createColumnAction(formData: FormData) {
  const user = await requireUser();

  const boardId = idSchema.safeParse(formData.get("boardId"));
  if (!boardId.success) {
    notFound();
  }

  const parsed = createColumnSchema.safeParse({
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/${boardId.data}?error=column`);
  }

  try {
    await createColumn(user.id, boardId.data, parsed.data.title);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof ConflictError) {
      redirect(`/dashboard/${boardId.data}?error=conflict`);
    }
    throw error;
  }

  refreshBoard(boardId.data);
}

export async function deleteColumnAction(formData: FormData) {
  const user = await requireUser();

  const boardId = idSchema.safeParse(formData.get("boardId"));
  const columnId = idSchema.safeParse(formData.get("columnId"));

  if (!boardId.success || !columnId.success) {
    notFound();
  }

  try {
    await deleteColumn(user.id, columnId.data);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  refreshBoard(boardId.data);
}

export async function createCardAction(
  formData: FormData,
): Promise<CardWriteResult> {
  const user = await requireUser();

  const boardId = idSchema.safeParse(formData.get("boardId"));
  const columnId = idSchema.safeParse(formData.get("columnId"));

  if (!boardId.success || !columnId.success) {
    return { ok: false, error: "invalid" };
  }

  const parsed = createCardSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    const card = await createCard(user.id, columnId.data, parsed.data);
    revalidateBoard(boardId.data);
    return { ok: true, card: toCardDto(card) };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "not-found" };
    }
    if (error instanceof ConflictError) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }
}

export async function updateCardAction(
  input: unknown,
): Promise<CardWriteResult> {
  const user = await requireUser();

  const parsed = updateCardContentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    const card = await updateCard(user.id, parsed.data.cardId, {
      title: parsed.data.title,
      description: parsed.data.description,
    });
    revalidateBoard(parsed.data.boardId);
    return { ok: true, card: toCardDto(card) };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "not-found" };
    }
    if (error instanceof ConflictError) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }
}

export async function deleteCardAction(
  formData: FormData,
): Promise<DeleteCardResult> {
  const user = await requireUser();

  const boardId = idSchema.safeParse(formData.get("boardId"));
  const cardId = idSchema.safeParse(formData.get("cardId"));

  if (!boardId.success || !cardId.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    await deleteCard(user.id, cardId.data);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "not-found" };
    }
    if (error instanceof ConflictError) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }

  revalidateBoard(boardId.data);
  return { ok: true };
}

/**
 * Перенос карточки после drop. UI шлёт целевой индекс; shift — в service.
 * Без `redirect` / `notFound`: иначе drag сбросит фокус и вспыхнёт страница.
 */
export async function moveCardAction(input: unknown): Promise<MoveCardResult> {
  const user = await requireUser();

  const parsed = moveCardSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    await updateCard(user.id, parsed.data.cardId, {
      columnId: parsed.data.columnId,
      position: parsed.data.position,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: "not-found" };
    }
    if (error instanceof ConflictError) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }

  revalidateBoard(parsed.data.boardId);
  return { ok: true };
}
