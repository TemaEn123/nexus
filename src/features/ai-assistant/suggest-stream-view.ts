import { suggestError } from "@/features/ai-assistant/form-error";

/**
 * После Stop не показываем alert: abort после HTTP 200 часто не AbortError,
 * а schema-fail на частичном объекте. Пустой финиш — не ошибка.
 */
export function suggestStreamView({
  stopped,
  sdkError,
  hasPartial,
  finishedInvalid,
  mapError = suggestError,
}: {
  stopped: boolean;
  sdkError: unknown;
  hasPartial: boolean;
  finishedInvalid: boolean;
  mapError?: (error: unknown) => string;
}): { error: string | undefined; empty: boolean } {
  if (stopped) {
    return { error: undefined, empty: false };
  }

  if (sdkError) {
    return { error: mapError(sdkError), empty: false };
  }

  if (finishedInvalid && !hasPartial) {
    return { error: undefined, empty: true };
  }

  return { error: undefined, empty: false };
}

/**
 * Stop снимает подсветку: `pick` не отдаём, даже если SDK ещё дописал чанк.
 */
export function priorityStreamFields({
  stopped,
  pick,
  reason,
}: {
  stopped: boolean;
  pick: number | undefined;
  reason: string | undefined;
}): { pick: number | undefined; reason: string | undefined } {
  if (stopped) {
    return { pick: undefined, reason: undefined };
  }

  return { pick, reason };
}
