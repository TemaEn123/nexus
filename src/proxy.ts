import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

/**
 * Next.js 16: `middleware.ts` переименован в `proxy.ts` (runtime — Node, не Edge).
 * Файл лежит в `src/` рядом с `app/`, это конвенция фреймворка, не FSD.
 *
 * `auth()` читает JWT из cookie и кладёт сессию в `req.auth`.
 * Prisma в authorize здесь не вызывается — только расшифровка cookie.
 *
 * Matcher узкий специально: не гоняем auth на `/`, статике и `/api/auth/*`
 * (callback GitHub должен дойти до Route Handler без редиректа).
 */
export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const { pathname } = nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Защищённые маршруты: без сессии — на логин.
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Уже вошли: формы login/register не нужны.
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
