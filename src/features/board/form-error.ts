/**
 * Коды, которые board actions кладут в `?error=` после redirect.
 * Неизвестные коды → общее сообщение, без Zod/Prisma.
 */
const BOARD_FORM_ERRORS: Record<string, string> = {
  invalid: "Title is required (1–120 characters).",
  column: "Column title is required (1–80 characters).",
  card: "Card title is required (1–200 characters).",
  conflict: "Someone else updated the board. Try again.",
};

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

  return BOARD_FORM_ERRORS[key] ?? "Something went wrong. Try again.";
}
