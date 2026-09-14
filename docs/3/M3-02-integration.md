# М3.2 — Integration (RTL): формы + MSW

Имена из плана → код: ColumnHeader = `CreateColumnForm` + шапка `KanbanColumn`; CardForm = `CreateCardForm` / `EditCardForm`; AuthForm = `LoginForm` / `RegisterForm`.

## Шаг 0 — граница integration-тестов

MSW — только там, где браузер реально делает `fetch`. Мок `@/shared/api/board` здесь запрещён: это снова M3.1. Coverage % не цель — critical path форм.

| Слой | Мок | Что проверяем |
| --- | --- | --- |
| REST колонок (`POST /api/boards/:id/columns`, `DELETE /api/columns/:id`) | MSW, конверт `{ data }` / `{ error: { code, message } }` | форма → Query → `fetch` → UI |
| Server Actions карточек/auth | `vi.mock` `actions.ts` | Zod в UI, optimistic, текст ошибки, submit |
| Prisma, Route Handlers, Auth.js, Query, DnD | нет | — |
| `window.confirm` | `vi.spyOn` | Cancel не шлёт запрос |

Actions — другой транспорт, не REST: Next-Action POST через MSW не парсим. Реальный login — Playwright (M3.3).

`KanbanColumn` / `KanbanCard` целиком не рендерим из‑за DnD и Suggest. Шапка колонки — только если без провайдера dnd-kit; иначе мок `@dnd-kit/react`, не выносить `ColumnHeader` «для тестов».

Husky / CI тесты не вешаем — это М4.

## Шаг 1 — каркас MSW + user-event

Сделано:

- DevDeps: `msw@2.15`, `@testing-library/user-event@14`. Postinstall MSW выключен (`allowBuilds.msw: false`) — нужен `msw/node`, не worker в `public/`
- `src/test/msw/`: `handlers` (POST колонки 201, DELETE колонки), `setupServer`
- `src/test/setup.ts`: listen / reset / close, `onUnhandledRequest: "error"`
- `vitest.config.mts`: `setupFiles`, jsdom `url: http://localhost:3000/` — relative `/api/...` резолвится
- Dummy `fetch("/api/boards/board-1/columns")` → 201, файл удалён. Старые 67 unit зелёные

Проверка: `pnpm test:run` (67) + `pnpm lint` + `pnpm typecheck`.

## Шаг 2 — обвязка рендера

Сделано:

- `src/test/render-board.tsx`: `renderBoardForm` — `userEvent`, QueryClient со `staleTime: Infinity` (сидим `setQueryData`, без GET доски в MSW), `useQuery` + `useBoardOptimistic` + `BoardOptimisticProvider`
- `createTestQueryClient` из M3.1 не трогали: хукам нужен refetch
- Не рендерим `KanbanColumn` / DnD

Проверка: `pnpm test:run` (68) + `pnpm lint` + `pnpm typecheck`.

## Шаг 3 — колонки: create + delete через MSW

Сделано:

- `CreateColumnForm`: пробелы → alert Zod, кэш не трогаем; `"Review"` → POST, last column `id: column-msw`, input сброшен; `server.use` 409 → conflict copy, snapshot
- `KanbanColumn`: мок `@dnd-kit/react` / `KanbanCard` / `CreateCardForm`, не выносили шапку. `confirm` false — колонка на месте; true — `column-1` уходит; 500 — generic alert и rollback; `temp-` — нет Delete
- `BoardFormTree.queryFn` читает кэш после `invalidateQueries` (GET доски в MSW нет)
- `cleanup()` в `src/test/setup.ts` — Vitest без `globals`, иначе RTL копит DOM

Проверка: `pnpm test:run` (75) + `pnpm lint` + `pnpm typecheck`.

## Шаг 4 — карточки: create / edit / delete через мок actions

Сделано:

- `vi.mock("@/features/board/actions")` — не MSW, не `@/shared/api/board`. `KanbanCard` / Suggest / DnD не рендерим
- Зонд `data-testid="optimistic-cards"` в `renderBoardForm`: overlay `useOptimistic`, Query не трогаем до `commitBoardQuery`. `hidden`, чтобы не путать getByRole
- `CreateCardForm`: пробелы → card-alert, action нет; temp в overlay, кэш ещё `card-1`, FormData без `position`, потом `card-action` и reset; conflict → copy, кэш тот же
- `EditCardForm`: пробелы → alert; без изменений / Cancel / Escape → `onClose`, action нет; Save → кэш `Renamed` + close; conflict → copy, title «Write tests»
- `DeleteCardForm`: `confirm` false — action нет; true — overlay пустой, кэш потом без `card-1`; `not_found` → generic в `onError`, карточка на месте

Проверка: `pnpm test:run` (86) + `pnpm lint` + `pnpm typecheck`.

## Шаг 5 — auth: LoginForm / RegisterForm

Сделано:

- RSC без `"use client"`: обычный `render`, не `renderBoardForm`. `vi.mock("@/features/auth/actions")` — не MSW, не Auth.js / Prisma
- Клиентского Zod и optimistic нет: ошибки — проп, как страница кладёт `authFormError(searchParams.error)` после redirect. HTML `minLength` jsdom не режет
- `LoginForm`: `credentials` / `invalid` баннеры; submit → `login(FormData)` email+password; GitHub — отдельная форма, `login` не зовётся
- `RegisterForm`: `exists` баннер; submit → `register`; кнопки GitHub нет

Проверка: `pnpm test:run` (93) + `pnpm lint` + `pnpm typecheck`.

## Шаг 6 — логические коммиты

Сделано (история на `feature/tests`, без squash):

1. MSW + user-event (handlers, setup, jsdom origin, `allowBuilds.msw: false`)
2. `renderBoardForm` + зонд overlay
3. колонки (`CreateColumnForm` + delete в `KanbanColumn`)
4. карточки (create/edit/delete, мок actions)
5. auth формы + отчёт `docs/3/M3-02-integration.md`

Husky по-прежнему только lint + typecheck.

M3.2 закрыт. Дальше: M3.3 — Playwright (login → board → card → drag → AI).
