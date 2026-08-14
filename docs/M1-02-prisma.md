# М1.2 — Prisma + Neon

Сделано:

- Prisma 7, Postgres на Neon (Direct URL), `.env.example`
- Схема: User, Board, Column, Card, ActivityLog
- Клиент: `src/shared/lib/db.ts` (singleton, только сервер)
- Миграция `init`, Studio для проверки связей

pnpm 11: сборки `prisma` / `@prisma/engines` разрешены в `pnpm-workspace.yaml`.

Дальше: Auth.js v5 (session, protected routes).
