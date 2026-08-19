import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

/**
 * Сессия обязательна на страницах: нет `user.id` → редирект на логин.
 * Proxy уже отсекает анонимов, это второй слой для RSC (dashboard).
 * Для Route Handlers — `requireApiUser()`: 401 JSON, без redirect.
 * Возвращаем `session.user`, чтобы вызывающему коду не проверять null.
 */
export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}
