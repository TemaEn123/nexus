import { ApiClientError } from "@/shared/api/http";

/**
 * Ошибки Suggest: 401 / 404 / нет ключа / сеть / обрыв стрима.
 * Stop глотает AbortError в SDK — здесь его нет. Неизвестное → общее, без JSON.
 */
const GENERIC_SUGGEST_ERROR = "Something went wrong. Try again.";

const SUGGEST_FORM_ERRORS: Record<string, string> = {
  unauthorized: "Sign in to suggest subtasks.",
  not_found: "Card not found.",
  unavailable: "AI is not configured. Add GROQ_API_KEY.",
};

const PRIORITY_FORM_ERRORS: Record<string, string> = {
  unauthorized: "Sign in to suggest priority.",
  not_found: "Board not found.",
  unavailable: SUGGEST_FORM_ERRORS.unavailable,
  validation_error: "Board has no cards to prioritize.",
};

function mapAiError(
  error: unknown,
  messages: Record<string, string>,
): string | undefined {
  if (!(error instanceof ApiClientError)) {
    return undefined;
  }

  if (error.code === "unauthorized" || error.status === 401) {
    return messages.unauthorized;
  }

  if (error.code === "not_found" || error.status === 404) {
    return messages.not_found;
  }

  if (error.code === "unavailable" || error.status === 503) {
    return messages.unavailable;
  }

  if (
    messages.validation_error &&
    (error.code === "validation_error" || error.status === 400)
  ) {
    return messages.validation_error;
  }

  return undefined;
}

export function suggestError(error: unknown): string {
  return mapAiError(error, SUGGEST_FORM_ERRORS) ?? GENERIC_SUGGEST_ERROR;
}

export function priorityError(error: unknown): string {
  return mapAiError(error, PRIORITY_FORM_ERRORS) ?? GENERIC_SUGGEST_ERROR;
}
