"use client";

import { useObject } from "@ai-sdk/react";
import { useRef, useState } from "react";
import { suggestSubtasksSchema } from "@/features/ai-assistant/schemas";
import { suggestFetch } from "@/features/ai-assistant/suggest-fetch";
import { suggestStreamView } from "@/features/ai-assistant/suggest-stream-view";
import { isTempId } from "@/features/board/temp-id";

/**
 * Стрим пунктов с `POST /api/cards/:id/suggest`.
 * В body ничего полезного не кладём — карточка на сервере из БД.
 * `temp-` id не зовём. Кнопка только вне edit — `KanbanCard`.
 *
 * HTTP 200 + пустое/битое тело: `useObject` не ставит `error` (только `!ok`).
 * `onFinish` ловит schema-fail; обрыв после 200 рвёт поток на сервере.
 * Stop не ошибка; финиш без пунктов — empty, не alert.
 */
export function useSuggestSubtasks(cardId: string) {
  const stoppedRef = useRef(false);
  const [finishedInvalid, setFinishedInvalid] = useState(false);
  const { object, submit, isLoading, stop, error, clear } = useObject({
    api: `/api/cards/${encodeURIComponent(cardId)}/suggest`,
    id: cardId,
    schema: suggestSubtasksSchema,
    fetch: suggestFetch,
    onFinish({ object: value }) {
      if (stoppedRef.current) {
        return;
      }

      if (value == null) {
        setFinishedInvalid(true);
      }
    },
  });

  function suggest() {
    if (isTempId(cardId) || isLoading) {
      return;
    }

    stoppedRef.current = false;
    setFinishedInvalid(false);
    clear();
    submit({});
  }

  const view = suggestStreamView({
    stopped: stoppedRef.current,
    sdkError: error,
    hasPartial: Boolean(object?.subtasks?.length),
    finishedInvalid,
  });

  return {
    subtasks: object?.subtasks,
    isLoading,
    error: view.error,
    empty: view.empty && !isLoading,
    suggest,
    stop() {
      stoppedRef.current = true;
      setFinishedInvalid(false);
      stop();
    },
    clear,
  };
}
