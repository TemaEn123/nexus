# М1.7 — Deploy

Сделано:

- Скрипт `pnpm db:migrate:deploy` (`prisma migrate deploy`). В npm `build` не клали — локальная сборка БД не трогает
- Vercel: Hobby, Next.js, корень `./`, Node 24, Build `pnpm db:migrate:deploy && pnpm build`, Install `pnpm install`
- БД: тот же Neon Direct, что локально (без `-pooler`, без Supabase). Миграции уже были накатаны (`No pending migrations`)
- Env на Vercel: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `NEXT_PUBLIC_APP_URL`. `AUTH_URL` нет
- Два GitHub OAuth App: localhost и production callback `/api/auth/callback/github`
- Live: https://nexus-pi-amber-56.vercel.app — URL в README

Проверка: билд на Vercel зелёный. На live URL — register / login (Credentials), dashboard. Анонимный `/dashboard` по-прежнему уходит на `/login`. GitHub OAuth: после env был Redeploy; если снова `?error=Configuration` — сверить Client ID/secret production-приложения и callback с доменом байт-в-байт. OG-дебаггер (opengraph.xyz) глазами в отчёт не клали.

Не делали: отдельная ветка Neon для prod, Prisma pooler, Docker, GitHub Actions, custom domain, Sentry.

Дальше: М2 — dashboard UI (create/delete boards), канбан.
