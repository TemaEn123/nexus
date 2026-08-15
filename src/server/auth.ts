import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import {
  TIMING_SAFE_DUMMY_HASH,
  verifyPassword,
} from "@/features/auth/password";
import { credentialsSchema } from "@/features/auth/schemas";
import { prisma } from "@/shared/lib/db";

/**
 * Конфиг Auth.js (next-auth v5).
 *
 * Файл в `src/server/`, потому что здесь Prisma, bcrypt и секреты из env.
 * Не импортировать из Client Component — только Server Actions / `auth()` в RSC.
 *
 * Стратегия сессии — JWT, хотя адаптер Prisma передан:
 * - адаптер без явной strategy включает "database"-сессии
 * - Credentials не умеет database-сессии (Auth.js бросает UnsupportedStrategy)
 * - адаптер всё равно создаёт User + Account при входе через GitHub
 * - JWT = зашифрованная cookie (JWE). `auth()` не ходит в Postgres за сессией
 *
 * GitHub `clientId` / `clientSecret` берутся из AUTH_GITHUB_ID и
 * AUTH_GITHUB_SECRET. AUTH_SECRET шифрует cookie сессии.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Клиент Prisma 7 генерируется в `@/generated/prisma`, не в `@prisma/client`.
  // Методы в рантайме те, что ждёт адаптер; опубликованные типы — нет.
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  session: { strategy: "jwt" },
  // Встроенный UI Auth.js не используем: и sign-in, и ошибки OAuth — на `/login`.
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Доверяем Host (localhost и потом Vercel), чтобы Auth.js собирал
  // callback URL без захардкоженного AUTH_URL.
  trustHost: true,
  providers: [
    /**
     * По умолчанию Auth.js не склеивает OAuth с уже существующим User
     * (часто Credentials без emailVerified) — ошибка OAuthAccountNotLinked.
     *
     * `allowDangerousEmailAccountLinking` доверяет GitHub, что email подтверждён,
     * и линкует Account к User с тем же email. В проде так нельзя без своей
     * верификации почты: иначе чужой GitHub с тем же адресом заберёт аккаунт.
     *
     * GitHub-only: passwordHash = null. Email/password: хеш есть, Account
     * появится после первого входа через GitHub с тем же email.
     */
    GitHub({
      allowDangerousEmailAccountLinking: true,
      // Credentials уже lowercase; без этого GitHub пишет email как в профиле,
      // и Unique + linking не сходятся (`User@x.com` ≠ `user@x.com`).
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email?.trim().toLowerCase() ?? null,
          image: profile.avatar_url,
        };
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Вернуть пользователя — вход успешен, `null` — отказ.
       * Не бросать ошибку на «неверный пароль»: разные страницы ошибок
       * могут выдать, существует ли email. `null` → CredentialsSignin всегда.
       */
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        // Всегда bcrypt (dummy, если нет хеша), чтобы не светить существование email.
        const passwordMatches = await verifyPassword(
          parsed.data.password,
          user?.passwordHash ?? TIMING_SAFE_DUMMY_HASH,
        );

        if (!user?.passwordHash || !passwordMatches) {
          return null;
        }

        // Хеш не возвращаем: этот объект попадает в JWT.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Вызывается при входе и при каждом обращении к JWT.
     * `user` есть только при первом входе (Credentials или OAuth).
     * Auth.js уже пишет `user.id` в `token.sub` (subject JWT). Делаем это явно,
     * чтобы session.user.id не зависел от кастомного claim (индексная
     * сигнатура JWT типизирует лишние поля как `unknown`).
     */
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    /**
     * Форма объекта, который отдают `auth()` / `useSession()`.
     * Без копирования `sub` → `user.id` Server Components видели бы email/name,
     * но не id из БД, который позже нужен для Board.ownerId.
     */
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
