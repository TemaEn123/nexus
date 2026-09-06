"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useSuggestSubtasks } from "@/features/ai-assistant/use-suggest-subtasks";
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

const suggestClass =
  "mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-950 disabled:opacity-60 dark:hover:text-zinc-50";
const addClass =
  "shrink-0 rounded-lg border border-zinc-300 px-2 py-0.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";
const errorClass = "mt-1 text-xs text-red-800 dark:text-red-200";

/**
 * Suggest под description. Add — тот же createCardAction, что ручная форма.
 * Стрим-ошибка — `suggestError` (не сырой JSON). Не монтировать на temp / edit.
 */
export function SuggestSubtasks({
  boardId,
  cardId,
  columnId,
}: {
  boardId: string;
  cardId: string;
  columnId: string;
}) {
  const { subtasks, isLoading, error, suggest, stop } =
    useSuggestSubtasks(cardId);
  const applyOptimistic = useApplyBoardOptimistic();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState<ReadonlySet<number>>(() => new Set());
  const [addError, setAddError] = useState<string>();
  const slotIds = useRef<string[]>([]);

  return (
    <div className="mt-1">
      {isLoading ? (
        <button className={suggestClass} onClick={stop} type="button">
          Stop
        </button>
      ) : (
        <button
          className={suggestClass}
          onClick={() => {
            slotIds.current = [];
            setAdded(new Set());
            setAddError(undefined);
            suggest();
          }}
          type="button"
        >
          Suggest subtasks
        </button>
      )}
      {isLoading ? (
        <p className="mt-1 text-xs text-zinc-500">Suggesting…</p>
      ) : null}
      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
      {addError ? (
        <p className={errorClass} role="alert">
          {addError}
        </p>
      ) : null}
      {subtasks && subtasks.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {subtasks.map((item, index) => {
            const title = item?.title?.trim() ?? "";
            if (!slotIds.current[index]) {
              slotIds.current[index] = crypto.randomUUID();
            }

            return (
              <li
                className="flex items-start justify-between gap-2"
                key={slotIds.current[index]}
              >
                <span className="min-w-0 text-xs text-zinc-600 dark:text-zinc-400">
                  {title || "…"}
                </span>
                {title && !added.has(index) ? (
                  <form
                    action={async () => {
                      const parsed = createCardSchema.safeParse({ title });
                      if (!parsed.success) {
                        setAddError(cardActionError("card"));
                        return;
                      }

                      setAddError(undefined);
                      const tempId = createTempId();
                      applyOptimistic({
                        type: "add",
                        columnId,
                        card: toCardDto({
                          id: tempId,
                          title: parsed.data.title,
                          description: null,
                          position: 0,
                          columnId,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        }),
                      });

                      const formData = new FormData();
                      formData.set("boardId", boardId);
                      formData.set("columnId", columnId);
                      formData.set("title", parsed.data.title);
                      const result = await createCardAction(formData);

                      if (!result.ok) {
                        setAddError(cardActionError(result.error));
                        return;
                      }

                      setAdded((current) => new Set(current).add(index));
                      await commitBoardQuery(queryClient, boardId, (current) =>
                        commitCreatedCard(
                          current,
                          columnId,
                          tempId,
                          result.card,
                        ),
                      );
                    }}
                  >
                    <PendingSubmit
                      className={addClass}
                      idleLabel="Add"
                      pendingLabel="Adding…"
                    />
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
