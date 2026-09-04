import { createBoardAction } from "@/features/board/actions";
import { CreateBoardSubmit } from "@/features/board/create-board-submit";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

/**
 * Server Component: `action={createBoardAction}`.
 * Баннер `?error=` — `CreateBoardError` в Suspense на странице, не здесь.
 */
export function CreateBoardForm() {
  return (
    <form action={createBoardAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          className={fieldClass}
          maxLength={120}
          name="title"
          required
          type="text"
        />
      </label>
      <CreateBoardSubmit className={buttonClass} />
    </form>
  );
}
