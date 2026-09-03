"use client";

import { useState } from "react";
import { boardFormError, mutationFormError } from "@/features/board/form-error";
import { PendingSubmit } from "@/features/board/pending-submit";
import { createCardSchema } from "@/features/board/schemas";
import { useCreateCardMutation } from "@/features/board/use-board-mutations";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";
const errorClass =
  "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/** `position` не шлём — service ставит max+1. Optimistic — temp id, потом cuid с 201. */
export function CreateCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const createCard = useCreateCardMutation(boardId);
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-2 px-3 pb-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const description = data.get("description");
        const parsed = createCardSchema.safeParse({
          title: data.get("title"),
          description:
            typeof description === "string" && description.trim().length > 0
              ? description
              : undefined,
        });

        if (!parsed.success) {
          setError(
            boardFormError("card") ??
              "Card title is required (1–200 characters).",
          );
          return;
        }

        setError(undefined);
        createCard.mutate(
          { columnId, ...parsed.data },
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
        New card
        <input
          className={fieldClass}
          disabled={createCard.isPending}
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
          disabled={createCard.isPending}
          maxLength={5000}
          name="description"
          placeholder="Optional"
          rows={2}
        />
      </label>
      <PendingSubmit
        className={buttonClass}
        idleLabel="Add card"
        pending={createCard.isPending}
        pendingLabel="Adding…"
      />
    </form>
  );
}
