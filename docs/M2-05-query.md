# М2.5 — TanStack Query: fetch/mutate, optimistic + rollback

Сделано:

- Пакеты: `@tanstack/react-query` / `@tanstack/react-query-devtools` **5.102.3**. `Providers` (`"use client"`) в root layout; layout остаётся RSC. На сервере — новый `QueryClient` на запрос (`isServer`), в браузере — один экземпляр. `staleTime: 60_000`, `retry: 1`. Devtools снизу слева, закрыты
- `src/shared/api/`: `boardKeys`, `getJson`/`postJson`/`patchJson`/`deleteJson` (контракт `{ data }` / `{ error.code }`, не `server-only` `api-response`), `fetchBoard` / `moveCard` / create/delete card+column, `toBoardDto` (Prisma `Date` → ISO, как `GET /api`)
- Доска: RSC по-прежнему `requireUser` + `getBoard` + `notFound()` и title. `setQueryData` + `HydrationBoundary` — клиент не делает GET сразу после открытия. `KanbanBoard` читает `useBoardQuery`
- Правило state: Query = колонки/карточки; preview **во время** drag — локальный `useState`. Zustand нет
- Move: `useMoveCardMutation` → `PATCH /api/cards/:id` `{ columnId, position }` (целевой индекс, как в 2.3). `onMutate`: cancel + snapshot + `setQueryData` в порядок preview. `onError`: откат snapshot. `onSettled`: `invalidate` — PATCH отдаёт одну карточку, не доску. Тот же слот / Escape — без запроса. `moveCardAction` из UI не зовём
- Create/delete card/column: клиентские формы, без Action-`redirect`. Optimistic: `temp-` id, после 201 — cuid. Пока temp — drag и Delete выключены. Пустой title — инлайн, без `?error=`. Confirm на delete остался. Список досок на `/dashboard` — по-прежнему RSC + Actions
- DnD + Query: пока жест живой, refetch (focus/reconnect) не пишем в UI; `cancelQueries` на start. После drop/Escape локальный список снова из кэша. Сенсоры, пустая колонка-droppable, persist по `cardLocation` (не `initialGroup`), без DragOverlay — как в 2.4

Проверка: `pnpm typecheck` + `pnpm lint`. Залогиненный UI глазами в этом шаге не гоняли (нет браузерных инструментов в сессии). Имеет смысл пройти: открытие доски без лишнего `GET /api/boards/:id`; reorder и перенос в пустую колонку → PATCH; тот же слот без запроса; офлайн/409 на move → откат; add card сразу, потом cuid; невалидный title без призрака; delete Cancel/OK; Escape / Tab+Space; Delete не начинает drag.

Не делали: Zustand, `useOptimistic`, RHF, shadcn, React Compiler, Query на список досок, edit title, drag колонок, gap-based, тесты, axe/Playwright, README про server vs UI state.

Дальше: М2.6 — Server Actions + `useOptimistic` для create/update/delete card (рядом с Query для fetch/DnD).
