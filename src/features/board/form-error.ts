import { ApiClientError } from "@/shared/api/http";

/**
 * Коды, которые board actions кладут в `?error=` после redirect.
 * Карточки CUD — инлайн через `cardActionError`, не query string.
 * Неизвестные коды → общее сообщение, без Zod/Prisma.
 */
const BOARD_FORM_ERRORS: Record<string, string> = {
  invalid: "Title is required (1–120 characters).",
  column: "Column title is required (1–80 characters).",
  card: "Card title is required (1–200 characters).",
  conflict: "Someone else updated the board. Try again.",
};

const GENERIC_FORM_ERROR = "Something went wrong. Try again.";

export function boardFormError(
  code: string | string[] | undefined,
): string | undefined {
  if (!code) {
    return undefined;
  }

  const key = Array.isArray(code) ? code[0] : code;
  if (!key) {
    return undefined;
  }

  return BOARD_FORM_ERRORS[key] ?? GENERIC_FORM_ERROR;
}

export function mutationFormError(error: unknown) {
  if (error instanceof ApiClientError && error.code === "conflict") {
    return BOARD_FORM_ERRORS.conflict;
  }

  return GENERIC_FORM_ERROR;
}

/** Create/update: `invalid` = пустой title. Delete: `invalid`/`not-found` — общее. */
export function cardActionError(
  code: string,
  kind: "write" | "delete" = "write",
): string {
  if (code === "conflict") {
    return BOARD_FORM_ERRORS.conflict;
  }

  if (kind === "write" && (code === "invalid" || code === "card")) {
    return BOARD_FORM_ERRORS.card;
  }

  return GENERIC_FORM_ERROR;
}
