"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateCardAction } from "@/features/board/actions";
import {
  commitBoardQuery,
  commitPatchedCard,
} from "@/features/board/commit-board-query";
import { cardActionError } from "@/features/board/form-error";
import { PendingSubmit } from "@/features/board/pending-submit";
import { updateCardContentSchema } from "@/features/board/schemas";
import type { BoardCard } from "@/features/board/types";
import { useApplyBoardOptimistic } from "@/features/board/use-board-optimistic";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const saveClass =
  "rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";
const cancelClass =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";
const errorClass = "text-xs text-red-800 dark:text-red-200";

export function EditCardForm({
  boardId,
  card,
  onClose,
}: {
  boardId: string;
  card: BoardCard;
  onClose: () => void;
}) {
  const applyOptimistic = useApplyBoardOptimistic();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const pendingRef = useRef(false);

  return (
    <form
      action={async (formData) => {
        const descriptionValue = formData.get("description");
        const parsed = updateCardContentSchema.safeParse({
          cardId: card.id,
          boardId,
          title: formData.get("title"),
          description:
            typeof descriptionValue === "string" &&
            descriptionValue.trim().length > 0
              ? descriptionValue
              : null,
        });

        if (!parsed.success) {
          setError(cardActionError("card"));
          return;
        }

        const nextTitle = parsed.data.title ?? card.title;
        const nextDescription =
          parsed.data.description !== undefined
            ? parsed.data.description
            : card.description;

        if (
          nextTitle === card.title &&
          nextDescription === (card.description ?? null)
        ) {
          onClose();
          return;
        }

        setError(undefined);
        applyOptimistic({
          type: "patch",
          cardId: card.id,
          title: parsed.data.title,
          description: parsed.data.description,
        });

        const result = await updateCardAction({
          cardId: card.id,
          boardId,
          title: parsed.data.title,
          description: parsed.data.description,
        });

        if (!result.ok) {
          setError(cardActionError(result.error));
          return;
        }

        await commitBoardQuery(queryClient, boardId, (current) =>
          commitPatchedCard(current, result.card),
        );
        onClose();
      }}
      className="flex min-w-0 flex-1 flex-col gap-2"
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (!pendingRef.current) {
          onClose();
        }
      }}
    >
      <EditCardPending
        card={card}
        error={error}
        onClose={onClose}
        pendingRef={pendingRef}
      />
    </form>
  );
}

function EditCardPending({
  card,
  error,
  onClose,
  pendingRef,
}: {
  card: BoardCard;
  error: string | undefined;
  onClose: () => void;
  pendingRef: { current: boolean };
}) {
  const { pending } = useFormStatus();
  pendingRef.current = pending;

  return (
    <>
      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
      <EditCardFields description={card.description} title={card.title} />
      <div className="flex gap-2">
        <PendingSubmit
          className={saveClass}
          idleLabel="Save"
          pendingLabel="Saving…"
        />
        <CancelEdit onClose={onClose} />
      </div>
    </>
  );
}

function EditCardFields({
  description,
  title,
}: {
  description: string | null;
  title: string;
}) {
  const { pending } = useFormStatus();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input
          className={fieldClass}
          defaultValue={title}
          disabled={pending}
          maxLength={200}
          name="title"
          ref={titleRef}
          required
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          className={fieldClass}
          defaultValue={description ?? ""}
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

function CancelEdit({ onClose }: { onClose: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cancelClass}
      disabled={pending}
      onClick={onClose}
      type="button"
    >
      Cancel
    </button>
  );
}
