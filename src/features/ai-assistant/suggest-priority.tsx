"use client";

import {
  SuggestEmpty,
  SuggestingLabel,
  SuggestReasonSkeleton,
  SuggestRetry,
} from "@/features/ai-assistant/suggest-stream-status";

const buttonClass =
  "shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";
const retryClass =
  "text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50";
const errorClass = "text-xs text-red-800 dark:text-red-200";

/**
 * Кнопка в header доски. Стрим `{ pick, reason }`; подсветка карточки — снаружи по `pick`.
 * Пустая доска: disabled, модель не зовём. Без ключа кнопка жива (503).
 */
export function SuggestPriority({
  disabled,
  empty = false,
  error,
  isLoading,
  onStop,
  onSuggest,
  reason,
}: {
  disabled: boolean;
  empty?: boolean;
  error: string | undefined;
  isLoading: boolean;
  onStop: () => void;
  onSuggest: () => void;
  reason: string | undefined;
}) {
  return (
    <div className="flex shrink-0 flex-col items-start gap-1">
      {isLoading ? (
        <button
          aria-label="Stop suggesting priority"
          className={buttonClass}
          onClick={onStop}
          type="button"
        >
          Stop
        </button>
      ) : (
        <button
          aria-label="Suggest priority"
          className={buttonClass}
          disabled={disabled}
          onClick={onSuggest}
          type="button"
        >
          Suggest priority
        </button>
      )}
      {isLoading ? <SuggestingLabel /> : null}
      {isLoading && !reason ? <SuggestReasonSkeleton /> : null}
      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
      {error && !isLoading ? (
        <SuggestRetry className={retryClass} onRetry={onSuggest} />
      ) : null}
      {empty ? (
        <>
          <SuggestEmpty />
          <SuggestRetry className={retryClass} onRetry={onSuggest} />
        </>
      ) : null}
      {reason ? (
        <output className="block max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          {reason}
        </output>
      ) : null}
    </div>
  );
}
