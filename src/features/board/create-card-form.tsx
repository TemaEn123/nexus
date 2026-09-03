"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCardAction } from "@/features/board/actions";
import {
  commitBoardQuery,
  commitCreatedCard,
} from "@/features/board/commit-board-query";
import { cardActionError } from "@/features/board/form-error";
import { PendingSubmit } from "@/features/board/pending-submit";
import { createCardSchema } from "@/features/board/schemas";
import { createTempId } from "@/features/board/temp-id";
import { useApplyBoardOptimistic } from "@/features/board/use-board-optimistic";
import { toCardDto } from "@/shared/api/board";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";
const errorClass =
  "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/** `position` не шлём — service ставит max+1. Optimistic — temp id, потом cuid из action. */
export function CreateCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const applyOptimistic = useApplyBoardOptimistic();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string>();

  return (
    <form
      action={async (formData) => {
        const description = formData.get("description");
        const parsed = createCardSchema.safeParse({
          title: formData.get("title"),
          description:
            typeof description === "string" && description.trim().length > 0
              ? description
              : undefined,
        });

        if (!parsed.success) {
          setError(cardActionError("card"));
          return;
        }

        setError(undefined);

        const tempId = createTempId();
        applyOptimistic({
          type: "add",
          columnId,
          card: toCardDto({
            id: tempId,
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            position: 0,
            columnId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        });

        const result = await createCardAction(formData);

        if (!result.ok) {
          setError(cardActionError(result.error));
          return;
        }

        await commitBoardQuery(queryClient, boardId, (current) =>
          commitCreatedCard(current, columnId, tempId, result.card),
        );
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2 px-3 pb-3"
      ref={formRef}
    >
      <input name="boardId" type="hidden" value={boardId} />
      <input name="columnId" type="hidden" value={columnId} />
      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
      <CreateCardFields />
      <PendingSubmit
        className={buttonClass}
        idleLabel="Add card"
        pendingLabel="Adding…"
      />
    </form>
  );
}

function CreateCardFields() {
  const { pending } = useFormStatus();

  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium">
        New card
        <input
          className={fieldClass}
          disabled={pending}
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
          disabled={pending}
          maxLength={5000}
          name="description"
          placeholder="Optional"
          rows={2}
        />
      </label>
    </>
  );
}
