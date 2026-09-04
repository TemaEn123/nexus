import type { BoardDetail } from "@/features/board/types";

/**
 * Title после `loadBoard`. Свой Suspense — Back не ждёт Prisma.
 */
export async function BoardHeading({
  boardPromise,
}: {
  boardPromise: Promise<BoardDetail>;
}) {
  const board = await boardPromise;

  return (
    <h1 className="shrink-0 text-2xl font-semibold tracking-tight">
      {board.title}
    </h1>
  );
}
