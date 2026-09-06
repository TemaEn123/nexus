import { ApiClientError } from "@/shared/api/http";

/**
 * Ошибки Suggest: 401 / 404 / нет ключа / сеть / обрыв стрима.
 * Stop глотает AbortError в SDK — здесь его нет. Неизвестное → общее, без JSON.
 */
const GENERIC_SUGGEST_ERROR = "Something went wrong. Try again.";

const SUGGEST_FORM_ERRORS: Record<string, string> = {
  unauthorized: "Sign in to suggest subtasks.",
  not_found: "Card not found.",
  unavailable: "AI is not configured. Add AI_GATEWAY_API_KEY.",
};

export function suggestError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "unauthorized" || error.status === 401) {
      return SUGGEST_FORM_ERRORS.unauthorized;
    }

    if (error.code === "not_found" || error.status === 404) {
      return SUGGEST_FORM_ERRORS.not_found;
    }

    if (error.code === "unavailable" || error.status === 503) {
      return SUGGEST_FORM_ERRORS.unavailable;
    }
  }

  return GENERIC_SUGGEST_ERROR;
}
