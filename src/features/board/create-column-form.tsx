import { createColumnAction } from "@/features/board/actions";
import { PendingSubmit } from "@/features/board/pending-submit";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

/** Server Component. `position` не шлём — service ставит max+1. */
export function CreateColumnForm({ boardId }: { boardId: string }) {
  return (
    <section className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
      <form action={createColumnAction} className="flex flex-col gap-2">
        <input name="boardId" type="hidden" value={boardId} />
        <label className="flex flex-col gap-1 text-sm font-medium">
          New column
          <input
            className={fieldClass}
            maxLength={80}
            name="title"
            placeholder="Title"
            required
            type="text"
          />
        </label>
        <PendingSubmit
          className={buttonClass}
          idleLabel="Add column"
          pendingLabel="Adding…"
        />
      </form>
    </section>
  );
}
