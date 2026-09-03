"use client";

import { useState } from "react";
import { boardFormError, mutationFormError } from "@/features/board/form-error";
import { PendingSubmit } from "@/features/board/pending-submit";
import { createColumnSchema } from "@/features/board/schemas";
import { useCreateColumnMutation } from "@/features/board/use-board-mutations";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";
const errorClass =
  "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/** `position` не шлём — service ставит max+1. Optimistic — temp id, потом cuid с 201. */
export function CreateColumnForm({ boardId }: { boardId: string }) {
  const createColumn = useCreateColumnMutation(boardId);
  const [error, setError] = useState<string>();

  return (
    <section className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const parsed = createColumnSchema.safeParse({
            title: new FormData(form).get("title"),
          });

          if (!parsed.success) {
            setError(
              boardFormError("column") ??
                "Column title is required (1–80 characters).",
            );
            return;
          }

          setError(undefined);
          createColumn.mutate(
            { title: parsed.data.title },
            {
              onSuccess: () => {
                form.reset();
              },
              onError: (cause) => {
                setError(mutationFormError(cause));
              },
            },
          );
        }}
      >
        {error ? <p className={errorClass}>{error}</p> : null}
        <label className="flex flex-col gap-1 text-sm font-medium">
          New column
          <input
            className={fieldClass}
            disabled={createColumn.isPending}
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
          pending={createColumn.isPending}
          pendingLabel="Adding…"
        />
      </form>
    </section>
  );
}
