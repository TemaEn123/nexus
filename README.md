# Nexus

Kanban-доска. Учебный проект: Next.js App Router, TypeScript, FSD-lite.

## Требования

- Node 24 (см. `.nvmrc`)
- [pnpm](https://pnpm.io) 11

```bash
nvm use
pnpm install
pnpm dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | Dev-сервер |
| `pnpm lint` | Biome (lint + проверка формата) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Production-сборка |

Pre-commit запускает `lint` + `typecheck`. Коммить из **терминала** — Source Control в Cursor сейчас пропускает git-хуки.

## Архитектура

FSD-lite: слои появляются вместе с кодом, пустые папки не создаём. `src/app` — роутинг Next.js (слой app). Не добавляй `src/pages` — Next.js примет это за Pages Router.

План: [docs/NEXUS-LEARNING-PLAN.md](docs/NEXUS-LEARNING-PLAN.md).
