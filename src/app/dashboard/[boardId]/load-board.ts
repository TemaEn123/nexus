import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { getBoard, NotFoundError } from "@/features/board/service";
import { requireUser } from "@/server/require-user";

/**
 * Доска для page / metadata / Suspense-детей. Один Prisma `getBoard` на запрос
 * (`cache`). Чужой или нет id → `notFound()` (тот же 404, что у API), не 403.
 */
export const loadBoard = cache(async (boardId: string) => {
  const user = await requireUser();

  try {
    return await getBoard(user.id, boardId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
});
