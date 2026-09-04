import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  BoardTitleSkeleton,
  ColumnsSkeleton,
} from "../_ui/dashboard-skeletons";
import { BoardFormError } from "./_ui/board-form-error";
import { BoardHeading } from "./_ui/board-heading";
import { HydratedKanban } from "./_ui/hydrated-kanban";
import { loadBoard } from "./load-board";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[boardId]">): Promise<Metadata> {
  const { boardId } = await params;
  const board = await loadBoard(boardId);

  return { title: board.title };
}

/**
 * Back сразу. Title и канбан ждут один `loadBoard` (cache + metadata).
 * `?error=` не на критическом пути. notFound — внутри loadBoard.
 */
export default function BoardPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[boardId]">) {
  const boardPromise = params.then(({ boardId }) => loadBoard(boardId));

  return (
    <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 px-4 py-6">
      <Link
        className="shrink-0 text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
        href="/dashboard"
      >
        Back to dashboard
      </Link>
      <Suspense fallback={<BoardTitleSkeleton />}>
        <BoardHeading boardPromise={boardPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <BoardFormError searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ColumnsSkeleton />}>
        <HydratedKanban boardPromise={boardPromise} />
      </Suspense>
    </main>
  );
}
