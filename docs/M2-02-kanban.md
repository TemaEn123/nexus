# М2.2 — Канбан: колонки и карточки

Сделано:

- Actions в `src/features/board/actions.ts`: `createColumnAction` / `deleteColumnAction` / `createCardAction` / `deleteCardAction` → `service.ts`. Prisma нет. REST не трогали
- После мутации `refreshBoard`: revalidate списка и доски, остаёмся на `/dashboard/[id]`. `boardId` hidden только для навигации; владение проверяет service
- Zod fail → `?error=column` / `?error=card`. `boardFormError` без Zod/Prisma. Чужой id → `notFound()` (404, не 403)
- Канбан из `getBoard` (колонки и карточки по `position`), без лишних fetch. `cache()` на page / metadata как в 2.1
- UI: `KanbanBoard` / `KanbanColumn` / `KanbanCard` в `[boardId]/_ui/`. Колонка `w-72`. Empty — «No cards». Description — `whitespace-pre-wrap`
- Create: «Add column» справа (пунктир), «Add card» в колонке (title + optional description). `position` не шлём — service `max+1`. `PendingSubmit`
- Delete: отдельная форма, не весь столбец. `ConfirmSubmit`: колонка — «Delete this column and its cards?»; карточка — «Delete this card?». Последнюю колонку можно удалить (каскад Prisma)
- Страница доски на всю ширину; список досок и header по-прежнему `max-w-2xl`. Скелетон — три колонки
- Responsive: `flex-nowrap` + горизонтальный скролл на любой ширине (не стопка). Высота — flex от layout; карточки `overflow-y-auto`, шапка и форма Add card снаружи скролла

Проверка: `pnpm typecheck` + `pnpm lint`. Залогиненный UI глазами: новая доска → To Do / In Progress / Done; add card/column; delete Cancel/OK; пробельный title → ошибка; ~375px — горизонтальный скролл колонок; Back — счётчик колонок. Анонимный `/dashboard/[id]` → **307** `/login`.

Не делали: rename/edit, move между колонками, unique/compact `position`, DnD, TanStack Query, Zustand, RHF, shadcn, `useOptimistic`, тесты.

Дальше: М2.3 — unique `(boardId, position)` / `(columnId, position)`, compact/shift, `P2002` → 409. Не начинать `@dnd-kit`, пока нет unique.
