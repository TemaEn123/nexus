import { handlers } from "@/server/auth";

/**
 * Catch-all Route Handler для Auth.js.
 *
 * Имя папки `[...nextauth]` обязательно: все HTTP-эндпоинты auth
 * (`/api/auth/*`) обрабатывает этот файл, в том числе:
 * - GET/POST `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`
 * - callback GitHub: `/api/auth/callback/github`
 *   (должен совпадать с Redirect URI в GitHub OAuth App)
 *
 * `handlers` — это `{ GET, POST }` из `NextAuth()` в `src/server/auth.ts`.
 * Реэкспортируем, чтобы App Router вызывал Auth.js для этих методов.
 */
export const { GET, POST } = handlers;
