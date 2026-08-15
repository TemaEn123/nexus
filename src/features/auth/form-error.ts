/**
 * Коды, которые actions кладут в `?error=` после redirect на форму.
 * `OAuthAccountNotLinked` приходит от Auth.js, если GitHub не склеили с User.
 * Прочие неизвестные коды → общее сообщение, без внутренних имён ошибок.
 */
const AUTH_FORM_ERRORS: Record<string, string> = {
  invalid: "Check email and password (at least 8 characters).",
  credentials: "Invalid email or password.",
  exists: "An account with this email already exists.",
  // Auth.js кладёт это в `?error=`, если OAuth не склеили с существующим User.
  OAuthAccountNotLinked:
    "This email is already used. Log in with email and password, then connect GitHub.",
};

export function authFormError(
  code: string | string[] | undefined,
): string | undefined {
  if (!code) {
    return undefined;
  }

  const key = Array.isArray(code) ? code[0] : code;
  if (!key) {
    return undefined;
  }

  return AUTH_FORM_ERRORS[key] ?? "Something went wrong. Try again.";
}
