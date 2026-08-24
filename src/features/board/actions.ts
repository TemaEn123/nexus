"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createBoardSchema, idSchema } from "@/features/board/schemas";
import {
  createBoard,
  deleteBoard,
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
