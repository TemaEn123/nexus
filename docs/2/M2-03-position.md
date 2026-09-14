# М2.3 — Position invariant

Сделано:

- Схема: у `Column` / `Card` вместо `@@index` — `@@unique([boardId, position])` / `@@unique([columnId, position])`. Миграция `prisma/migrations/20260824161100_column_card_position_unique/` (дроп старых индексов → unique). Накатили `pnpm db:migrate:deploy`
- Compact до unique не делали: доску сняли в Studio (каскад), дублей `position` не из чего было. Два проекта Neon с именем `nexus` — живой тот, куда ушёл migrate; URL локалки и Vercel пока один Direct
- `ConflictError` + `ApiErrorCode` `"conflict"`. `handleBoardError`: P2002 → **409**, не 500, без стека Prisma. Actions create column/card: `ConflictError` → `?error=conflict` (`boardFormError`). Prisma в actions нет, `redirect` не глотаем
- Move в `service.ts`, одна `$transaction`: sentinel `position = -1` → сдвиг соседей по одному (Postgres unique не DEFERRABLE) → целевой слот. Карточка на другую колонку — только той же доски. После delete — compact `0..n−1`
- Create по-прежнему `max+1`. В начале tx `SELECT … FOR UPDATE` на `Board`, чтобы max+1 не пересекался со shift. Unique + 409 — второй слой (гонка create)
- Контракт PATCH: клиент шлёт **целевой индекс**, не сырой слот. Занятый → shift **200**, не 409. Индекс больше длины / перенос без `position` — **clamp в конец**. Дробное / отрицательное → **400**. `position` в create body нет (`strictObject`)

Проверка: `pnpm typecheck` + `pnpm lint`. Миграция на Neon применилась. Залогиненный UI: add column/card как в 2.2, порядок колонок тот же. Параллельные два POST, `PATCH { "position": 0 }` curl и clamp `999` в этом прогоне не гоняли.

Не делали: `@dnd-kit`, UI «переставить карточку», TanStack Query, gap-based 1000/2000/3000, отдельный prod-URL Neon, DEFERRABLE unique.

Дальше: М2.4 — `@dnd-kit`. UI только шлёт `columnId` / `position` в PATCH/action; арифметику слотов не дублировать. Пока локалка = прод, `git push` с этой миграцией накатит unique на ту же БД (`No pending migrations`, если уже deploy’нули локально).
