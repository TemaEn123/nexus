import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/server/auth";

/**
 * Сессия обязательна на страницах: нет `user.id` → редирект на логин.
 * Proxy уже отсекает анонимов, это второй слой для RSC (dashboard).
 * Для Route Handlers — `requireApiUser()`: 401 JSON, без redirect.
 * Возвращаем `session.user`, чтобы вызывающему коду не проверять null.
 *
 * `cache()`: UserMenu, dashboard page и `loadBoard` делят один `auth()`
 * на запрос. `requireApiUser` не трогаем — там 401, не redirect.
 */
export const requireUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
});
