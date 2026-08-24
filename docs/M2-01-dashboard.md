# М2.1 — Dashboard: список, create/delete

Сделано:

- Server Actions `src/features/board/actions.ts`: `createBoardAction` / `deleteBoardAction` → уже существующий `service.ts`. Prisma в actions нет. REST `/api/boards` не трогали
- Create: Zod `createBoardSchema` → `revalidatePath("/dashboard")` → `/dashboard/[id]`. Пустой/пробельный title → `/dashboard?error=invalid`
- Delete: hidden `boardId` → `deleteBoard`; чужой/битый id → `notFound()` (404, не 403). Confirm в клиентской кнопке
- `dashboard/loading.tsx` убран: родительский loading оборачивал бы `[boardId]`. Список — `Suspense` + `BoardsSkeleton`. Доска — свой `loading.tsx`
- Заглушка `/dashboard/[boardId]`: title, Back, «Kanban — step 2.2». `getBoard` + `requireUser`; `cache()` на metadata и page. Колонки не рисуем. `proxy.ts` не трогали
- Форма create как login: Server Component, `useFormStatus` на сабмите. Ошибки — `boardFormError`, без Zod/Prisma
- Список: название — `Link`, Delete — отдельная форма (весь `<li>` не ссылка). `_count.columns`. Empty — «No boards yet»
- Dashboard про доски, не профиль (имя в UserMenu). Ширина `max-w-2xl` у header / page / stub / скелетона

Проверка: `pnpm typecheck` + `pnpm lint`. Анонимный `/dashboard` и `/dashboard/[id]` → **307** `/login`. Залогиненный UI глазами: create → stub, Back, список со ссылкой, delete Cancel/OK, пробельный title → ошибка.

Не делали: канбан/колонки, rename, unique `position`, TanStack Query, Zustand, RHF, shadcn, тесты.

Дальше: М2.2 — канбан (колонки и карточки) на заглушке `/dashboard/[boardId]`. Unique `position` — М2.3, до DnD.
