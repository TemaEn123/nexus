import { createCardAction } from "@/features/board/actions";
import { PendingSubmit } from "@/features/board/pending-submit";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

/** Server Component. `position` не шлём — service ставит max+1. */
export function CreateCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  return (
    <form action={createCardAction} className="flex flex-col gap-2 px-3 pb-3">
      <input name="boardId" type="hidden" value={boardId} />
      <input name="columnId" type="hidden" value={columnId} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        New card
        <input
          className={fieldClass}
          maxLength={200}
          name="title"
          placeholder="Title"
          required
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          className={fieldClass}
          maxLength={5000}
          name="description"
          placeholder="Optional"
          rows={2}
        />
      </label>
      <PendingSubmit
        className={buttonClass}
        idleLabel="Add card"
        pendingLabel="Adding…"
      />
    </form>
  );
}
