import { afterEach, expect, test, vi } from "vitest";
import {
  reserveSuggestAttempt,
  SUGGEST_DAILY_LIMIT,
  suggestWindowStart,
} from "@/features/ai-assistant/rate-limit";
import { Prisma } from "@/generated/prisma/client";

const { updateMany, create } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  create: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/db", () => ({
  prisma: {
    aiRateLimit: { updateMany, create },
  },
}));

const userId = "user_1";
const now = Date.parse("2026-09-30T15:04:00.000Z");
const windowStart = new Date("2026-09-30T00:00:00.000Z");

function uniqueConflict() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

afterEach(() => {
  updateMany.mockReset();
  create.mockReset();
});

test("suggestWindowStart is UTC midnight", () => {
  expect(suggestWindowStart(now).toISOString()).toBe(windowStart.toISOString());
});

test("reserveSuggestAttempt increments a row under the daily limit", async () => {
  updateMany.mockResolvedValue({ count: 1 });

  await expect(reserveSuggestAttempt(userId, now)).resolves.toBe(true);

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      userId,
      windowStart,
      count: { lt: SUGGEST_DAILY_LIMIT },
    },
    data: { count: { increment: 1 } },
  });
  expect(create).not.toHaveBeenCalled();
});

test("reserveSuggestAttempt creates the first row of the window", async () => {
  updateMany.mockResolvedValue({ count: 0 });
  create.mockResolvedValue({});

  await expect(reserveSuggestAttempt(userId, now)).resolves.toBe(true);

  expect(create).toHaveBeenCalledWith({
    data: { userId, windowStart, count: 1 },
  });
});

test("reserveSuggestAttempt treats a unique-key race as the limit", async () => {
  updateMany.mockResolvedValue({ count: 0 });
  create.mockRejectedValue(uniqueConflict());

  await expect(reserveSuggestAttempt(userId, now)).resolves.toBe(false);
});

test("reserveSuggestAttempt rethrows unexpected create errors", async () => {
  updateMany.mockResolvedValue({ count: 0 });
  create.mockRejectedValue(new Error("db down"));

  await expect(reserveSuggestAttempt(userId, now)).rejects.toThrow("db down");
});
