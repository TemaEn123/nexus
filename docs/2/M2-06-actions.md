# М2.6 — Server Actions + `useOptimistic` для create/update/delete card

Сделано:

- Карточки CUD — Server Actions, не REST. `createCardAction` / `updateCardAction` / `deleteCardAction` возвращают `{ ok, card? }` или `{ ok: false, error: "invalid" | "not-found" | "conflict" }`, как `moveCardAction`. Без `redirect` / `notFound` — иначе optimistic бессмысленен. После успеха — `revalidatePath` без навигации. Prisma только в `service.ts`. Даты в `card` — ISO (`toCardDto`), как hydrate/REST
- `updateCardAction` + `updateCardContentSchema`: только `title` / `description`. `columnId` / `position` по-прежнему у Query-move (`PATCH /api/cards/:id`)
- `useOptimistic` поверх Query в `KanbanBoard`. Редьюсер `add` / `patch` / `remove`. `apply` только внутри transition (`form action`). Колонки create/delete — Query `onMutate`, как в 2.5
- Create: `<form action>`, клиентский Zod до overlay (пустой title — инлайн, без призрака). `temp-` id, после ответа — cuid в кэш. Пока temp — drag и Delete выключены. `PendingSubmit` через `useFormStatus`
- Update: клик по title / description / «Add description». Save / Escape / Cancel. Пока форма открыта — sortable выключен. Без изменений — action не зовём. Escape во время Save не закрывает форму
- Delete: `ConfirmSubmit` без пропа `pending`. Cancel — action не уходит. Ошибка — в шапке колонки (`role="alert"`): карточка на время optimistic-remove размонтируется
- Кэш после успеха: `commitBoardQuery` — `cancel` → `setQueryData` → `invalidate`. Сначала кэш (cuid / новый текст / без карточки), потом refetch — иначе overlay откатится на старую доску
- Ошибки: `cardActionError`, инлайн, не `?error=card`. Коды: пустой title → card; `conflict`; иначе «Try again». Баннер страницы `?error=card` не показывает; `?error=column` / `conflict` оставлены
- Список вне drag рисуется из Query/`useOptimistic`, без копии в `useState`. Иначе эффект синка + новый массив колонок с каждого render (Compiler) → `Maximum update depth exceeded` после create/update/delete. Drag — по-прежнему локальный state
- `useCreateCardMutation` / `useDeleteCardMutation` и клиентские `createCard` / `deleteCard` в `shared/api` убраны. REST `POST/PATCH/DELETE /api/cards` живы (move + будущие тесты)

Проверка: `pnpm typecheck` + `pnpm lint`. Залогиненный UI: add card сразу, потом можно drag; пустой title без призрака; edit title/description, Escape, conflict/сеть → откат; Delete Cancel/OK; цикл после мутации больше не падает. DnD как в 2.5 (тот же слот без запроса, пустая колонка, Escape). Create/delete колонки — Query. Network: card CUD — action POST, не `/api/columns/.../cards`; move — `PATCH /api/cards/:id`.

Не делали: Zustand, RHF, shadcn, Query на список досок, create/delete колонок через `useOptimistic` (их actions всё ещё редиректят, UI их не зовёт), drag колонок, gap-based, тесты, axe/Playwright, README про server vs UI state. React Compiler уже включён в `next.config` — разбор `useMemo`/`useCallback` не делали.

Дальше: М2.7 — React Compiler (зачем ещё `useMemo`/`useCallback`, что убрать).
