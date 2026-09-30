import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/db";

/** Сколько Suggest subtasks можно зарезервировать за одни сутки UTC. */
export const SUGGEST_DAILY_LIMIT = 10;

/** Начало календарных суток UTC для `AiRateLimit.windowStart`. */
export function suggestWindowStart(now: number) {
  const date = new Date(now);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Резервирует одну попытку. `false` — лимит уже исчерпан или гонка на ключе
 * `(userId, windowStart)`. Ошибку Groq эта функция не откатывает.
 */
export async function reserveSuggestAttempt(userId: string, now = Date.now()) {
  const windowStart = suggestWindowStart(now);
  const updated = await prisma.aiRateLimit.updateMany({
    where: {
      userId,
      windowStart,
      count: { lt: SUGGEST_DAILY_LIMIT },
    },
    data: { count: { increment: 1 } },
  });

  if (updated.count > 0) {
    return true;
  }

  try {
    await prisma.aiRateLimit.create({
      data: { userId, windowStart, count: 1 },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }

    throw error;
  }
}
