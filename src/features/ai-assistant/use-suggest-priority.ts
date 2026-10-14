"use client";

import { useObject } from "@ai-sdk/react";
import { useRef, useState } from "react";
import { priorityError } from "@/features/ai-assistant/form-error";
import { suggestPrioritySchema } from "@/features/ai-assistant/schemas";
import { suggestFetch } from "@/features/ai-assistant/suggest-fetch";
import {
  priorityStreamFields,
  suggestStreamView,
} from "@/features/ai-assistant/suggest-stream-view";

/**
 * Стрим `{ pick, reason }` с `POST /api/boards/:id/priority`.
 * Body пустой — доска на сервере из БД. Карточки не двигаем.
 *
 * HTTP 200 + пустое/битое тело: `useObject` не ставит `error` (только `!ok`).
 * `onFinish` ловит schema-fail; обрыв после 200 рвёт поток на сервере.
 * Stop не ошибка и не подсветка; финиш без объекта — empty, не alert.
 */
export function useSuggestPriority(boardId: string) {
  const stoppedRef = useRef(false);
  const [stopped, setStopped] = useState(false);
  const [finishedInvalid, setFinishedInvalid] = useState(false);
  const { object, submit, isLoading, error, clear } = useObject({
    api: `/api/boards/${encodeURIComponent(boardId)}/priority`,
    id: boardId,
    schema: suggestPrioritySchema,
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
    if (isLoading) {
      return;
    }

    stoppedRef.current = false;
    setStopped(false);
    setFinishedInvalid(false);
    clear();
    submit({});
  }

  const view = suggestStreamView({
    stopped: stoppedRef.current,
    sdkError: error,
    hasPartial: object?.pick != null || Boolean(object?.reason),
    finishedInvalid,
    mapError: priorityError,
  });
  const fields = priorityStreamFields({
    stopped,
    pick: object?.pick,
    reason: object?.reason,
  });

  return {
    pick: fields.pick,
    reason: fields.reason,
    isLoading,
    error: view.error,
    empty: view.empty && !isLoading,
    suggest,
    stop() {
      stoppedRef.current = true;
      setStopped(true);
      setFinishedInvalid(false);
      clear();
    },
  };
}
