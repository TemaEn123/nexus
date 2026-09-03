"use client";

import { useQueryClient } from "@tanstack/react-query";
import { deleteCardAction } from "@/features/board/actions";
import {
  commitBoardQuery,
  commitRemovedCard,
} from "@/features/board/commit-board-query";
import { ConfirmSubmit } from "@/features/board/confirm-submit";
import { cardActionError } from "@/features/board/form-error";
import { useApplyBoardOptimistic } from "@/features/board/use-board-optimistic";

const deleteButtonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

export function DeleteCardForm({
  boardId,
  cardId,
  onError,
}: {
  boardId: string;
  cardId: string;
  onError: (message: string | undefined) => void;
}) {
  const applyOptimistic = useApplyBoardOptimistic();
  const queryClient = useQueryClient();

  return (
    <form
      action={async (formData) => {
        onError(undefined);
        applyOptimistic({ type: "remove", cardId });

        const result = await deleteCardAction(formData);

        if (!result.ok) {
          onError(cardActionError(result.error, "delete"));
          return;
        }

        await commitBoardQuery(queryClient, boardId, (current) =>
          commitRemovedCard(current, cardId),
        );
      }}
    >
      <input name="boardId" type="hidden" value={boardId} />
      <input name="cardId" type="hidden" value={cardId} />
      <ConfirmSubmit
        className={deleteButtonClass}
        confirmMessage="Delete this card?"
        idleLabel="Delete"
        pendingLabel="Deleting…"
      />
    </form>
  );
}
