# Nexus

Kanban-доска. Учебный проект: Next.js App Router, TypeScript, FSD-lite.

## Требования

- Node 24 (см. `.nvmrc`)
- [pnpm](https://pnpm.io) 11
- Postgres: [Neon](https://neon.tech) (Direct `DATABASE_URL`, хост без `-pooler`)

```bash
nvm use
cp .env.example .env   # вставь Direct URL из Neon
pnpm install
pnpm db:migrate
pnpm dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | Dev-сервер |
| `pnpm lint` | Biome (lint + проверка формата) |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm build` | Production-сборка |
| `pnpm db:migrate` | Prisma-миграция |
| `pnpm db:studio` | Таблицы в браузере |
| `pnpm db:generate` | Клиент Prisma (также в `postinstall`) |

Pre-commit запускает `lint` + `typecheck`. Коммить из **терминала** — Source Control в Cursor сейчас пропускает git-хуки.

`.env` в git не попадает. Prisma (`src/shared/lib/db.ts`) — только сервер, не `"use client"`.

## Архитектура

FSD-lite: слои появляются вместе с кодом, пустые папки не создаём. `src/app` — роутинг Next.js (слой app). Не добавляй `src/pages` — Next.js примет это за Pages Router.

План: [docs/NEXUS-LEARNING-PLAN.md](docs/NEXUS-LEARNING-PLAN.md).
