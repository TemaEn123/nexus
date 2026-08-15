import type { DefaultSession } from "next-auth";

/**
 * По умолчанию у Auth.js `Session.user` — `{ name, email, image }`, без `id`.
 * Владение канбаном (Board.ownerId) требует id пользователя из БД на каждом
 * `auth()`, поэтому расширяем типы модуля, а не кастим в каждом вызове.
 *
 * `declare module` мержится с Auth.js, а не заменяет весь Session.
 * Id читаем из JWT `token.sub` (стандартный subject) в `auth.ts`.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
