import "server-only";

import type { Session } from "next-auth";
import { jsonError } from "@/server/api-response";
import { auth } from "@/server/auth";

type ApiUser = Session["user"];

type RequireApiUserSuccess = { ok: true; user: ApiUser };
type RequireApiUserFailure = { ok: false; response: Response };

/**
 * Сессия обязательна для REST API: нет `user.id` → 401 JSON.
 *
 * Не вызываем `requireUser()`: тот делает `redirect("/login")`, и curl/клиент
 * получили бы HTML вместо `{ error }`. Proxy тоже не подходит — его matcher
 * специально не включает `/api/*`, чтобы GitHub callback и API не ловили 302.
 *
 * Тот же приём, что у `parseBody`: discriminated union. Handler пишет
 * `if (!gate.ok) return gate.response` и дальше работает с `gate.user.id`
 * без повторной проверки null.
 */
export async function requireApiUser(): Promise<
  RequireApiUserSuccess | RequireApiUserFailure
> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "Sign in required"),
    };
  }

  return { ok: true, user: session.user };
}
