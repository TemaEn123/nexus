"use client";

import { useObject } from "@ai-sdk/react";
import { useRef, useState } from "react";
import { priorityError } from "@/features/ai-assistant/form-error";
import { suggestPrioritySchema } from "@/features/ai-assistant/schemas";
import { suggestFetch } from "@/features/ai-assistant/suggest-fetch";

/**
 * Стрим `{ pick, reason }` с `POST /api/boards/:id/priority`.
 * Body пустой — доска на сервере из БД. Карточки не двигаем.
 *
 * HTTP 200 + пустое/битое тело: `useObject` не ставит `error` (только `!ok`).
 * `onFinish` ловит schema-fail; обрыв после 200 рвёт поток на сервере.
 */
export function useSuggestPriority(boardId: string) {
  const stoppedRef = useRef(false);
  const [finishError, setFinishError] = useState<unknown>();
  const { object, submit, isLoading, stop, error, clear } = useObject({
    api: `/api/boards/${encodeURIComponent(boardId)}/priority`,
    id: boardId,
    schema: suggestPrioritySchema,
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
    if (isLoading) {
      return;
    }

    stoppedRef.current = false;
    setFinishError(undefined);
    clear();
    submit({});
  }

  return {
    pick: object?.pick,
    reason: object?.reason,
    isLoading,
    error:
      error || finishError ? priorityError(error ?? finishError) : undefined,
    suggest,
    stop() {
      stoppedRef.current = true;
      stop();
    },
  };
}
