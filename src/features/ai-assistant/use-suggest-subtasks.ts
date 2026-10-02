"use client";

import { useObject } from "@ai-sdk/react";
import { useRef, useState } from "react";
import { suggestError } from "@/features/ai-assistant/form-error";
import { suggestSubtasksSchema } from "@/features/ai-assistant/schemas";
import { suggestFetch } from "@/features/ai-assistant/suggest-fetch";
import { isTempId } from "@/features/board/temp-id";

/**
 * Стрим пунктов с `POST /api/cards/:id/suggest`.
 * В body ничего полезного не кладём — карточка на сервере из БД.
 * `temp-` id не зовём. Кнопка только вне edit — `KanbanCard`.
 *
 * HTTP 200 + пустое/битое тело: `useObject` не ставит `error` (только `!ok`).
 * `onFinish` ловит schema-fail; обрыв после 200 рвёт поток на сервере.
 */
export function useSuggestSubtasks(cardId: string) {
  const stoppedRef = useRef(false);
  const [finishError, setFinishError] = useState<unknown>();
  const { object, submit, isLoading, stop, error, clear } = useObject({
    api: `/api/cards/${encodeURIComponent(cardId)}/suggest`,
    id: cardId,
    schema: suggestSubtasksSchema,
    fetch: suggestFetch,
    onFinish({ error: validationError, object: value }) {
      if (stoppedRef.current) {
        return;
      }

      if (validationError || value == null) {
        setFinishError(validationError ?? new Error("empty"));
      }
    },
  });

  function suggest() {
    if (isTempId(cardId) || isLoading) {
      return;
    }

    stoppedRef.current = false;
    setFinishError(undefined);
    clear();
    submit({});
  }

  return {
    subtasks: object?.subtasks,
    isLoading,
    error:
      error || finishError ? suggestError(error ?? finishError) : undefined,
    suggest,
    stop() {
      stoppedRef.current = true;
      stop();
    },
    clear,
  };
}
