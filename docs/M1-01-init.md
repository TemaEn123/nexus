# М1.1 — Инициализация

Сделано:

- Next.js 16 (App Router, `src/`, TS, Tailwind v4, React Compiler) + pnpm + Node 24
- Biome вместо ESLint/Prettier; workspace Cursor перекрывает глобальный форматтер
- Husky pre-commit: `pnpm lint` + `pnpm typecheck`
- FSD-lite: слои не создаём заранее; `src/app` = роутер Next.js

Коммиты — из терминала: UI Cursor не запускает git-хуки.

Дальше: Prisma (User, Board, Column, Card, ActivityLog).
