# М2.4 — @dnd-kit: drag карточек + keyboard a11y

Сделано:

- Пакеты: `@dnd-kit/react`, `@dnd-kit/helpers`, `@dnd-kit/dom` (сенсоры, Accessibility). Не legacy `@dnd-kit/core`
- `moveCardAction` + `moveCardSchema`: клиент шлёт `cardId` / `boardId` / `columnId` / целевой `position`. Shift в `updateCard`. Успех — `revalidatePath` без `redirect` / `notFound`. `{ ok: true }` или `{ ok: false; error: "invalid" | "not-found" | "conflict" }`
- Остров: `KanbanBoard` `"use client"`. Preview — локальный state + `move()` на `dragOver`. Zustand / TanStack Query нет
- Карточка — `useSortable` (`id` = cuid, `group` = колонка). Колонка — `useDroppable` (`accept: "item"`), не sortable. Пустая колонка: список всегда, «No cards» внутри droppable. Шапка и Add card снаружи скролла
- Сенсоры: мышь 8px, touch delay 200ms, `preventActivation` на button/input. Keyboard: Space/Enter, стрелки, Escape. Анонсы — title карточки и колонки, не cuid
- Drag: `cursor-grab` / shadow. Clone / DragOverlay нет — список уже живой через `move()`
- Persist на drop: snapshot vs текущий список (`cardLocation`). Не `initialGroup` — после переноса в другой `<ul>` инстанс sortable сбрасывается, action не уходил
- RSC: sync по порядку id; во время drag пропсы в `pending`, `finishDrag` применяет после drop

**Локальная БД — не Neon.** Neon из РФ только через VPN → `P1008` / `SocketTimeout`, дашборд по 10+ с. Dev: Postgres 16 в Docker (`nexus-pg`). `docker.io` тоже рвался — образ с `mirror.gcr.io/library/postgres:16`. Порт **5433** (на 5432 уже свой Postgres). `.env`: `postgresql://nexus:nexus@127.0.0.1:5433/nexus?sslmode=disable`. `pnpm db:migrate:deploy` — 4 миграции, включая unique position. Vercel по-прежнему Neon Direct. JWT от Neon на локалке → `P2003 Board_ownerId_fkey`; нужен Sign out и `/register` заново. Полный docker-compose (app+db) — М4.

Проверка: `pnpm typecheck` + `pnpm lint`. Залогиненный UI на локальном Postgres: reorder в колонке; перенос в другую, в том числе пустую, → action + refresh тот же порядок; тот же слот — без action; Delete без случайного drag; Tab → Space → стрелки → Space / Escape; ~375px скролл колонок. Create/delete card/column как в 2.2.

Не делали: drag колонок, TanStack Query, Zustand, `useOptimistic`, RHF, shadcn, gap-based, axe-core / Playwright, отдельный prod-URL Neon в репо, README про локальный Docker.

Дальше: М2.5 — TanStack Query (optimistic + rollback) поверх этого DnD.
