# М1.5 — App Router basics

Сделано:

- Route group `(auth)`: общий layout для `/login` и `/register`. URL те же, `proxy.ts` не трогали
- `dashboard/layout.tsx`: header (Nexus → `/`, Sign out). `auth()` только в `UserMenu` внутри Suspense — иначе layout блокирует `loading.tsx`
- `dashboard/loading.tsx`: скелетон контента страницы, не header
- Preview досок: `listBoards` в отдельном Suspense. Названия или «No boards yet». Ссылок на доску нет
- `error.tsx` (root + dashboard) и `global-error.tsx`: `"use client"`, `retry` (Next 16.3). Общая разметка — `src/app/_ui/route-error.tsx`. В prod без `error.message`, digest можно показать. Sentry нет
- `not-found.tsx`: свой 404, без чтения сессии. Ссылки Home и Dashboard

Проверка: `pnpm typecheck` + `pnpm lint`. HTTP smoke (аноним): `/dashboard` → **307** `/login`; `/login` и `/register` **200**; `/this-does-not-exist` **404** «Page not found»; `GET /api/boards` → **401 JSON**. Залогиненный UI (скелетон, UserMenu, список досок) глазами не гоняли. Throw в page для error boundary в коммит не клали.

Не делали: create/delete досок, маршрут канбана, SEO, TanStack Query, shadcn, Sentry.

Дальше: SEO (`generateMetadata`, OG, favicon).
