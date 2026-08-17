# М1.4 — REST API

Сделано:

- Route Handlers в `src/app/api/` (URL задаёт App Router, не `src/server/`)
- Логика: `src/features/board/service.ts`; Zod: `src/features/board/schemas.ts` (`z.strictObject`, Zod 4)
- Контракт: `{ data }` / `{ error: { code, message, details? } }` — `src/server/api-response.ts`
- `requireApiUser()`: нет сессии → **401 JSON**. `requireUser()` для RSC по-прежнему redirect. `proxy.ts` на `/api` не вешали
- CRUD: `GET|POST /api/boards`, `GET|PATCH|DELETE /api/boards/:id`, `POST .../columns`, `PATCH|DELETE /api/columns/:id`, `POST .../cards`, `PATCH|DELETE /api/cards/:id`
- Id родителя только из URL. Чужой/нет ресурса → **404**, не 403
- POST доски: транзакция + колонки To Do / In Progress / Done; GET/PATCH доски — колонки и карточки по `position`
- ActivityLog: create/update/move/delete card, create board/column. `BOARD_DELETED` / `COLUMN_DELETED` не пишем (каскад снесёт)
- Перенос карточки — только на колонку **той же** своей доски
- Гонка check-then-act: `P2025`/`P2003` → 404; create колонки/карточки и ownership в одной `$transaction`

Проверка: HTTP smoke 31/31 (401, CRUD, Zod strict, move, чужая колонка другой доски, фейковый id). Второй аккаунт и Studio глазами не гоняли.

Не делали: UI, TanStack Query, тесты, пагинация, уплотнение `position`.

Дальше: App Router basics (`loading.tsx`, `error.tsx`, Suspense).
