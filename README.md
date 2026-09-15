# Nexus

Kanban-доска. Учебный проект: Next.js App Router, TypeScript, FSD-lite.

**Live:** [https://nexus-pi-amber-56.vercel.app](https://nexus-pi-amber-56.vercel.app)
[![CI](https://github.com/TemaEn123/Nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/TemaEn123/Nexus/actions/workflows/ci.yml)

## Core Web Vitals

Lab, mobile slow-4G, `pnpm start`, 2026-09-14. Не CrUX и не замер live Vercel из РФ.

| | Бюджет | Lab |
| --- | --- | --- |
| LCP | < 2.5s | **720 ms** (`/`, заголовок Nexus) |
| INP | < 200ms | **16 ms** |
| CLS | < 0.1 | **0** |

Повторить: `pnpm build && pnpm start --hostname 127.0.0.1`, затем `pnpm perf:cwv:suite`. Разведка и оптимизации: [М3.5](docs/3/M3-05-perf.md), [М3.6](docs/3/M3-06-opt.md).

## Требования

- Node 24 (см. `.nvmrc`)
- [pnpm](https://pnpm.io) 11
- Postgres: [Neon](https://neon.tech) (Direct `DATABASE_URL`, хост без `-pooler`)
- GitHub OAuth App (для входа через GitHub)
- Docker + Compose (опционально, локальный стек)

```bash
nvm use
cp .env.example .env
```

В `.env`: Direct URL из Neon, `AUTH_SECRET` (`pnpm dlx auth secret`), `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`, `AI_GATEWAY_API_KEY` (Suggest subtasks, [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — только сервер, не `NEXT_PUBLIC_`).

Локальный OAuth App: Homepage `http://localhost:3000`, Redirect URI `http://localhost:3000/api/auth/callback/github`. Открывай именно `localhost`, не `127.0.0.1`. Для Vercel — **второе** OAuth App с production URL (один Callback на приложение).

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Открой [http://localhost:3000](http://localhost:3000). Вход: `/login`, `/register`, `/dashboard`.

## Docker (локально)

Прод — Vercel + Neon, не этот compose. Образы: `mirror.gcr.io` (не `docker.io`).

Полный стек: `db` → one-shot `migrate` (`prisma migrate deploy`) → slim `app` (`output: "standalone"`, `node server.js`). Runner ~**97 MB** content (было ~848 MB). Свободные порты **3000** и **5433**, в `.env` — `AUTH_SECRET` и GitHub. Compose подменяет `DATABASE_URL` на `@db:5432`.

```bash
docker compose up --build
```

Открой [http://localhost:3000](http://localhost:3000), не `127.0.0.1`. Первый pull Node из РФ может идти долго. Как ужат образ: [М4.2](docs/4/M4-02-slim.md).

Только БД, Next на хосте: `docker compose up db -d`, в `.env` `postgresql://nexus:nexus@127.0.0.1:5433/nexus?sslmode=disable`, затем `pnpm db:migrate:deploy && pnpm dev`. Если уже крутится ad-hoc `nexus-pg` на 5433 — сначала `docker stop nexus-pg`. Не вместе с `pnpm dev` на том же `:3000`.

## Скрипты

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | Dev-сервер |
| `pnpm lint` | Biome (lint + проверка формата) |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm test:run` | Vitest, один прогон (CI job `quality`) |
| `pnpm test:e2e` | Playwright; локально Chrome + Postgres на 5433 |
| `pnpm build` | Production-сборка |
| `pnpm start` | Production-сервер (`next start`) |
| `pnpm perf:cwv` | Lab LCP / CLS / INP на одном URL |
| `pnpm perf:cwv:suite` | То же на `/`, `/login`, dashboard, доске |
| `pnpm db:migrate` | Prisma-миграция (dev, интерактив) |
| `pnpm db:migrate:deploy` | Накатить уже лежащие миграции (prod / Vercel) |
| `pnpm db:studio` | Таблицы в браузере |
| `pnpm db:generate` | Клиент Prisma (также в `postinstall`) |

Pre-commit запускает `lint` + `typecheck` (без тестов). Коммить из **терминала** — Source Control в Cursor сейчас пропускает git-хуки.

PR и `main`: GitHub Actions — `quality` (`lint` → `typecheck` → `test:run`) и `e2e` (свой Postgres, Playwright Chromium). Локально quality:

```bash
pnpm lint && pnpm typecheck && pnpm test:run
```

E2E: `docker compose up db -d`, затем `pnpm test:e2e`. Preview URL на PR пишет бот Vercel. [М4.3](docs/4/M4-03-ci.md).

`.env` и `.vercel` в git не попадают. Prisma (`src/shared/lib/db.ts`) и Auth.js (`src/server/auth.ts`) — только сервер, не `"use client"`.

## Deploy (Vercel + Neon)

Тот же Neon Direct URL, что локально (хост без `-pooler`). Supabase не используем.

В Vercel: Node **24.x**. Build Command:

```bash
pnpm db:migrate:deploy && pnpm build
```

Install: `pnpm install` (`postinstall` → `prisma generate`). После смены `NEXT_PUBLIC_*` — Redeploy, не Restart.

| Env | Зачем |
| --- | --- |
| `DATABASE_URL` | Neon Direct |
| `AUTH_SECRET` | JWT-cookie; на проде лучше отдельный секрет (`pnpm dlx auth secret`) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | **production** OAuth App, не localhost |
| `NEXT_PUBLIC_APP_URL` | `https://nexus-pi-amber-56.vercel.app` без `/` в конце; OG / `metadataBase` |
| `AI_GATEWAY_API_KEY` | Suggest subtasks; только сервер. Без ключа кнопка жива, ответ — ошибка |

`AUTH_URL` не ставим (`trustHost: true`). Preview на PR делает **Vercel GitHub App** (бот пишет URL в PR), не GitHub Actions. Те же env — та же Neon, что прод. GitHub OAuth на `*.vercel.app` может дать `Configuration` (отдельное OAuth App не заводили).

## Архитектура

FSD-lite: слои появляются вместе с кодом, пустые папки не создаём. `src/app` — роутинг Next.js (слой app). Не добавляй `src/pages` — Next.js примет это за Pages Router.

Auth: Auth.js v5 (`next-auth@beta`), JWT-сессия, Credentials + GitHub. Защита маршрутов — `src/proxy.ts` (Next.js 16, не `middleware.ts`) + `requireUser()` в RSC.

План: [docs/NEXUS-LEARNING-PLAN.md](docs/NEXUS-LEARNING-PLAN.md). Стек шагов 1–3 к собесу: [docs/M1-STACK-INTERVIEW.md](docs/M1-STACK-INTERVIEW.md).
