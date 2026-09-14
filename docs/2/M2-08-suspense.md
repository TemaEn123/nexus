# М2.8 — Suspense + streaming: скелеты колонок, anti-waterfall

Сделано:

- Карта границ: header (`UserMenu` в Suspense) и список досок (`BoardsSkeleton`) уже стримились с 2.1; `dashboard/loading.tsx` по-прежнему нет (мигал бы на `[boardId]`). Водопады: dashboard `await requireUser` + `searchParams` до формы Create; доска ждала полный `getBoard` до Back. `getBoard` — один Prisma `include` колонок и карточек; так и оставили (hydrate Query 2.5)
- `requireUser` = `cache()`: `UserMenu`, `BoardList` и `loadBoard` делят один `auth()` на запрос. Редирект `/login` без сессии. `requireApiUser` без cache — там 401, не redirect
- `/dashboard`: page синхронный, без верхнего `await`. Заголовок и форма Create сразу. `?error=` — `CreateBoardError` в Suspense. `BoardList` сам зовёт закэшированный `requireUser` и `listBoards`; пока Prisma — `BoardsSkeleton`
- `/dashboard/[id]`: `loadBoard` вынесен, тот же `cache` для metadata и UI. Page отдаёт Back сразу; `boardPromise = params.then(loadBoard)`. Title — `BoardHeading` + `BoardTitleSkeleton`. Канбан + `setQueryData`/`HydrationBoundary` — `HydratedKanban` + `ColumnsSkeleton`. `?error=` — `BoardFormError` отдельно (`error=card` по-прежнему не баннер). `notFound()` внутри `loadBoard`. Второй запрос «только title» не плодили
- Один `ColumnsSkeleton` (три `w-72`): `loading.tsx` через `BoardPageSkeleton`, Suspense канбана, Query pending в `KanbanBoard`. Локальный `KanbanPending` убран

Проверка: `npm run typecheck` + `npm run lint`. Залогиненный UI: dashboard — форма раньше списка; доска — Back раньше карточек, колонки сначала скелет; 404 чужого id; create/delete/DnD как в 2.5–2.6. GitHub `/login?error=Configuration` в этой сессии — не OAuth: Docker/`nexus-pg` на `:5433` были выключены, callback дошёл, `getUserByAccount` не достучался до БД. После `docker start nexus-pg` вход прошёл

Не делали: `cacheComponents` / PPR, N запросов по колонкам, Query на список досок, Zustand, RHF, shadcn, column CUD через `useOptimistic`, drag колонок, gap-based, тесты, axe/Playwright, README про server vs UI state. AI-стриминг — следующий шаг

Дальше: М2.9 — AI MVP «Suggest subtasks» (Vercel AI SDK, Route Handler как proxy).
