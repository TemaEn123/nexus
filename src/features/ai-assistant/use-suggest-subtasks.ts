"use client";

import { useObject } from "@ai-sdk/react";
import { suggestError } from "@/features/ai-assistant/form-error";
import { suggestSubtasksSchema } from "@/features/ai-assistant/schemas";
import { isTempId } from "@/features/board/temp-id";
import { apiErrorFromResponse } from "@/shared/api/http";

/**
 * По умолчанию `useObject` кладёт `response.text()` в `Error.message` (сырой JSON).
 * Читаем контракт `{ error: { code, message } }` до того, как SDK его проглотит.
 */
async function suggestFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }

  return response;
}

/**
 * Стрим пунктов с `POST /api/cards/:id/suggest`.
 * В body ничего полезного не кладём — карточка на сервере из БД.
 * `temp-` id не зовём. Кнопка только вне edit — `KanbanCard`.
 */
export function useSuggestSubtasks(cardId: string) {
  const { object, submit, isLoading, stop, error, clear } = useObject({
    api: `/api/cards/${encodeURIComponent(cardId)}/suggest`,
    id: cardId,
    schema: suggestSubtasksSchema,
    fetch: suggestFetch,
  });

  function suggest() {
    if (isTempId(cardId) || isLoading) {
      return;
    }

    clear();
    submit({});
  }

  return {
    subtasks: object?.subtasks,
    isLoading,
    error: error ? suggestError(error) : undefined,
    suggest,
    stop,
    clear,
  };
}
