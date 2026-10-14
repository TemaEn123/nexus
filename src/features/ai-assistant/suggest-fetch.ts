import { apiErrorFromResponse } from "@/shared/api/http";

/**
 * По умолчанию `useObject` кладёт `response.text()` в `error.message` (сырой JSON).
 * Читаем контракт `{ error: { code, message } }` до того, как SDK его проглотит.
 */
export async function suggestFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }

  return response;
}
