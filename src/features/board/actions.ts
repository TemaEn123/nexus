"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  createBoardSchema,
  createCardSchema,
  createColumnSchema,
  idSchema,
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
} from "@/features/board/service";
import { requireUser } from "@/server/require-user";

/**
 * Server Actions дашборда. Формы зовут эти функции, не `/api/boards`.
 * Prisma сюда не импортируем — владение и запись в `service.ts`.
 *
 * `redirect` / `notFound` бросают (так Next.js делает навигацию).
 * Их нельзя глотать: снаружи try, либо после узкого `catch` как в auth.
 */

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

function refreshBoard(boardId: string): never {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${boardId}`);
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

export async function createCardAction(formData: FormData) {
  const user = await requireUser();

  const boardId = idSchema.safeParse(formData.get("boardId"));
  const columnId = idSchema.safeParse(formData.get("columnId"));

  if (!boardId.success || !columnId.success) {
    notFound();
  }

  const parsed = createCardSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    redirect(`/dashboard/${boardId.data}?error=card`);
  }

  try {
    await createCard(user.id, columnId.data, parsed.data);
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

export async function deleteCardAction(formData: FormData) {
  const user = await requireUser();

  const boardId = idSchema.safeParse(formData.get("boardId"));
  const cardId = idSchema.safeParse(formData.get("cardId"));

  if (!boardId.success || !cardId.success) {
    notFound();
  }

  try {
    await deleteCard(user.id, cardId.data);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  refreshBoard(boardId.data);
}
