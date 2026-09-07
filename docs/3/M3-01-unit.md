# М3.1 — Unit (Vitest): utils, Zod, query keys, hooks

## Шаг 0 — граница unit-тестов

Мокаем на границе модуля, не внутри чужого кода. Coverage % не цель — critical path логики.

| Слой | Мок | Что проверяем |
| --- | --- | --- |
| Utils, Zod, `boardKeys` | нет | `safeParse`, строки ошибок, форма ключа |
| Хуки Query | `vi.fn()` на `fetchBoard` / `moveCard` / `createColumn` / `deleteColumn` из `@/shared/api/board` | кэш, optimistic preview, rollback, тот же `queryKey` |
| Сеть как у браузера | нет (MSW — М3.2) | — |
| Prisma, Route Handlers, формы, DnD | нет | — |

`useSuggestSubtasks` в M3.1 не трогаем: слишком связан с `@ai-sdk/react`. Только `suggestError` + `isTempId`.

Не мокаем `@tanstack/react-query`. На тест — новый `QueryClient` с `retry: false`, не `makeQueryClient()` (`retry: 1`, `staleTime: 60_000`).

Husky / CI тесты не вешаем — это М4.

## Шаг 1 — каркас Vitest

Сделано:

- DevDeps по [гайду Next.js](https://nextjs.org/docs/app/guides/testing/vitest) + пример `with-vitest`: `vitest@3.2.4`, `@vitejs/plugin-react@5`, `jsdom@26`, `@testing-library/react@16`, `@testing-library/dom`, `vite-tsconfig-paths`. Не latest Vitest 5: он тянет Vite 8 / Rolldown, install упирался в timeout native-биндинга
- `vitest.config.mts`: jsdom, `@/` через `tsconfigPaths`, `include: src/**/*.test.{ts,tsx}`, `exclude` + `e2e/**`. `passWithNoTests` — каркас без тестов не краснеет
- Скрипты: `pnpm test` (watch), `pnpm test:run` (один прогон). Husky не трогали
- `pnpm-workspace.yaml`: `esbuild: true` (Vite postinstall). Dummy-тест на алиас `@/` прошёл, файл удалён

Проверка: `pnpm test:run` (0 тестов, exit 0) + `pnpm lint` + `pnpm typecheck`.

## Шаг 2 — фикстура `BoardDetail`

Сделано:

- `src/features/board/board-fixture.ts`: `makeBoard` / `makeColumn` / `makeCard`. Даты — фиксированный ISO, не `Date`. `position`, `boardId`, `columnId` проставляются из родителя и индекса, если не передали
- По умолчанию две колонки (вторая пустая) — удобно для move и drop в пустую
- `makeBoard({ columns: [] })` — пустая доска. Сид частично перекрывает дефолты

Проверка: `pnpm test:run` + `pnpm lint` + `pnpm typecheck`.

## Шаг 3 — utils

Сделано (колокация `*.test.ts`):

- `temp-id`: префикс `temp-`, cuid без него — false, `"temp"` без дефиса — false
- form-error (board / auth / AI): пустой searchParam, известные коды, `[0]` из массива, неизвестное → generic без JSON/Prisma. `mutationFormError` / `suggestError` по `ApiClientError`
- `http`: `{ data }` → payload; 409 → `ApiClientError`; не-JSON → `Invalid JSON response`; 200 без `data` → `Invalid response`. `fetch` только через `vi.stubGlobal`
- `dto`: Prisma `Date` → ISO
- `getSiteUrl`: localhost, origin без path, мусор → throw
- AI: prompt с/без description; `toTextStreamOrFail` склеивает delta и рвёт поток на `error`

Не трогали: `password.ts`, `kanban-dnd.ts`, `service.ts`, `parseBody`.

Проверка: `pnpm test:run` (29) + `pnpm lint` + `pnpm typecheck`.

## Шаг 4 — Zod-схемы

Сделано (`safeParse`, без `.parse` и без дубля `z.infer`):

- Board: trim title, пустой/длинный, `strictObject` (опечатка `titel`, `position` в create), description create не нормализует `""` в `null`, update — хотя бы одно поле, `position` только `int ≥ 0`, `description: null` ок, `updateCardContentSchema` без DnD-полей
- Auth: email trim+lowercase до проверки формата; пароль 8–72
- AI: 3–7 пунктов, trim title, 201 символ — fail. Лимиты из `SUGGEST_SUBTASKS_MIN/MAX`

Проверка: `pnpm test:run` (42) + `pnpm lint` + `pnpm typecheck`.

## Шаг 5 — query key factory

Сделано:

- `src/shared/api/query-keys.test.ts`: `all` = `["boards"]`, `detail(id)` = `[...all, id]`
- Один id — `toEqual`, не `toBe` (новый массив каждый вызов; Query сравнивает структурно)
- Разные id — разные ключи (чужой кэш не инвалидируется)
- `detail` начинается с `all` — prefix `invalidateQueries({ queryKey: boardKeys.all })` продолжит матчить, если появится `list`

Проверка: `pnpm test:run` (47) + `pnpm lint` + `pnpm typecheck`.

## Шаг 6 — optimistic reducer и commit*

Сделано (чистые функции, без `renderHook` и без `QueryClient`):

- `applyBoardOptimistic`: `undefined` доска; add в нужную колонку с перезаписью `columnId`/`position`; без дубля id; чужая колонка не трогается; patch title не затирает description и наоборот; remove оставляет соседей; исходный board не мутирует
- `commitCreatedCard`: temp → cuid; temp уже нет → append; cuid уже есть → без дубля
- `commitPatchedCard` / `commitRemovedCard`: замена по id / remove через тот же reducer

`commitBoardQuery` (cancel + setQueryData + invalidate) — шаг 7, вместе с хуками.

Проверка: `pnpm test:run` (57) + `pnpm lint` + `pnpm typecheck`.

## Шаг 7 — хуки Query

Сделано:

- Хелпер `query-test.tsx`: новый `QueryClient` на тест (`retry: false`, не `makeQueryClient`), wrapper, `deferred`
- Мок только `@/shared/api/board` (`vi.fn()`), не Query
- `useBoardQuery`: `fetchBoard(boardId)` → `boardKeys.detail`. `shouldRefetchBoard(ref)` вынесен — во время drag refetch focus/reconnect выключен
- `useMoveCardMutation`: кэш сразу = preview, `moveCard` без `boardId` в body, ошибка → snapshot
- create column: `temp-` + пустые cards, success подставляет cuid и не теряет cards; ошибка → snapshot. Delete: колонка пропадает, ошибка → возврат
- `commitBoardQuery`: cancel → setQueryData → invalidate; пустой кэш не создаёт доску
- `useApplyBoardOptimistic`: без провайдера — throw; с провайдером зовёт `apply`

Не делали: `useSuggestSubtasks`, формы, MSW, реальный `/api`.

Проверка: `pnpm test:run` (67) + `pnpm lint` + `pnpm typecheck`.

## Шаг 8 — логические коммиты

Сделано (история на `feature/tests`, без squash):

1. каркас Vitest (конфиг, скрипты, lockfile, `esbuild` allowBuilds)
2. фикстура + utils + form-error + http + query keys
3. Zod-схемы
4. `applyBoardOptimistic` + `commit*`
5. хуки Query + отчёт `docs/3/M3-01-unit.md`

Husky по-прежнему только lint + typecheck.

M3.1 закрыт. Дальше: M3.2 — Integration (RTL) + MSW для CardForm / ColumnHeader / AuthForm.
