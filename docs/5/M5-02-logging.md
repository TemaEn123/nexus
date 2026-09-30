# М5.2 — Structured logging: JSON в Route Handlers

Имена из плана → код: задача 2 «Structured logging: JSON logs в Route Handlers (не `console.log`)». Цель — одна строка stdout = один JSON с полями для поиска в Vercel Runtime Logs / Docker logs. Sentry/GlitchTip (М5.1) не заменяем: там стеки падений, здесь дневник запросов. Error UI, AI rate limit, security, email verify, OTel — другие задачи М5.

## Шаг 0 — граница

Цель: наши REST Route Handlers пишут JSON в stdout; 500 из `handleBoardError` — тоже JSON, не сырой `console.error(error)`. Клиентский контракт `{ data }` / `{ error }` не меняется.

Сейчас: `handleBoardError` в `src/features/board/service.ts` делает `console.error(error)` на 500. В `src/app/api/**/route.ts` access-лога нет. Пакет логгера нет. `console.error` в `RouteError` — браузер + уже есть `Sentry.captureException` (М5.1), не этот шаг. Auth route (`/api/auth/[...nextauth]`) не трогаем.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| `src/server/logger.ts` | нет | `server-only`; `info` / `warn` / `error`; одна JSON-строка в stdout |
| Поля лога | нет | `level`, `msg`, `time`; плюс `method`, `path`, `status`, `code`, `userId`, `durationMs`, `requestId` |
| `requestId` | нет | `x-vercel-id` на проде, иначе короткий id на запрос |
| Error serialization | нет | `name`, `message`, Prisma `code` — не весь объект / не пароли / не cookie |
| `handleBoardError` | нет | заменить `console.error`; 404/409 → `warn`, 500 → `error` |
| Access log wrapper | нет | обёртка (напр. `withApiLog`) на наши 7 route files (не auth) |
| AI `suggest` | нет | тот же wrapper; тело стрима не логировать |
| Unit-тест logger | нет | spy на `console.log` → `JSON.parse`; без секретов в payload |
| Vercel / Docker sink | нет | только stdout; Axiom/Datadog/Loki не поднимаем |
| pino / winston | нет | не обязательны; тонкий logger без pretty-transport |
| Auth `[...nextauth]` | нет | не оборачиваем |
| `RouteError` / browser `console.error` | нет | М5.1 + задача 3 (UI) |
| Prisma query log | нет | не включаем |
| ActivityLog (БД) | нет | другая сущность, не stdout |
| `ci.yml` / Husky / Ruleset | нет | не меняем |
| Error UI / rate limit / security / email / OTel | нет | задачи 3–7 |

Не делать: свободный `console.log` в handlers; логировать password / Authorization / cookie / тело логина / title карточки; слать стек Prisma клиенту; отдельный SaaS логов; OTel; менять JSON-контракт API; required check «logging»; трогать auth route.

Ключи: **лог ≠ Sentry**. 401/409 — в лог (поиск), в GlitchTip не нужны. 500 — лог с полями + при желании позже снова `captureException` из service (не обязательно в М5.2).

Прод: смотреть Vercel Runtime Logs. Compose/`pnpm start` — тот же stdout.

Порядок: граница → `logger` + тест → `handleBoardError` → `withApiLog` на routes → локальная проверка → README + этот отчёт → после merge одна строка на live.

Проверка шага 0: этот файл.

## Шаг 1 — `logger` + unit-тест

Сделано: `src/server/logger.ts` — тонкий `server-only` logger без зависимостей.

- `logger.info` / `logger.warn` / `logger.error`
- одна строка stdout = один JSON
- общие поля: `level`, `msg`, `time`
- дополнительные поля передаём объектом: `method`, `path`, `status`, `code`, `userId`, `durationMs`, `requestId`
- `Error` сериализуется как `{ name, message, code? }`, без stack trace
- чувствительные ключи редактируются в `[redacted]`: password / authorization / cookie / token / secret / apiKey
- `requestIdFrom(request)`: `x-vercel-id`, иначе `crypto.randomUUID()`
- `pathFromRequest(request)`: pathname без query string

Тест: `src/server/logger.test.ts`.

## Шаг 2 — `handleBoardError`

Сделано: `src/features/board/service.ts` больше не пишет сырой `console.error(error)`.

- `NotFoundError` / Prisma missing record → `logger.warn("board_api_error", { status: 404, code: "not_found", error })`
- `ConflictError` / Prisma unique conflict → `logger.warn("board_api_error", { status: 409, code: "conflict", error })`
- неизвестная ошибка → `logger.error("board_api_error", { status: 500, code: "internal", error })`
- API-ответы не изменились: 404 / 409 / 500 возвращают тот же JSON-контракт

Оставшийся `console.error` — только в `RouteError` на клиентской error boundary; это не часть Route Handlers и рядом уже есть `Sentry.captureException`.

## Шаг 3 — access-log wrapper

Сделано: `src/server/api-log.ts` — `withApiLog(handler)`.

- создаёт request context: `method`, `path`, `requestId`
- после ответа пишет `logger.info("api_request", { status, durationMs })`
- если handler неожиданно бросил — пишет `logger.error("api_request", { status: 500, durationMs, error })` и пробрасывает ошибку дальше
- `src/server/logger.ts` теперь использует `AsyncLocalStorage`, поэтому `board_api_error` и `api_request` получают общий контекст
- `requireApiUser()` дописывает `userId` в текущий log context после успешной сессии

Обёрнуты все свои Route Handlers:

- `GET` / `POST /api/boards`
- `GET` / `PATCH` / `DELETE /api/boards/[boardId]`
- `POST /api/boards/[boardId]/columns`
- `PATCH` / `DELETE /api/columns/[columnId]`
- `POST /api/columns/[columnId]/cards`
- `PATCH` / `DELETE /api/cards/[cardId]`
- `POST /api/cards/[cardId]/suggest`

Не трогали: `/api/auth/[...nextauth]`. Stream body AI route не логируем.

Тесты:

- `src/server/logger.test.ts` — logger, redaction, error serialization, request context + `userId`
- `src/server/api-log.test.ts` — wrapper пишет access log с `method`, `path`, `requestId`, `userId`, `status`, `durationMs`

## Шаг 4 — локальная проверка JSON-строк

Сделано: локальный smoke через реальный Next dev server.

Первый запуск `next dev --port 3100` в sandbox упал на `uv_interface_addresses`; запуск с `--hostname 127.0.0.1` стартовал, но упёрся в `EMFILE` watcher limit. Рабочая команда:

```bash
ulimit -n 8192 && ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100
```

Smoke 1:

```bash
curl -i http://127.0.0.1:3100/api/boards
```

Ответ:

```json
{"error":{"code":"unauthorized","message":"Sign in required"}}
```

Лог stdout:

```json
{"method":"GET","path":"/api/boards","requestId":"600c9967-d457-48fd-8232-7ad4a7f2251a","status":401,"durationMs":4,"level":"info","msg":"api_request","time":"2026-09-21T11:34:57.929Z"}
```

Smoke 2:

```bash
curl -i -H 'x-vercel-id: smoke::step4' 'http://127.0.0.1:3100/api/boards?debug=true'
```

Лог stdout:

```json
{"method":"GET","path":"/api/boards","requestId":"smoke::step4","status":401,"durationMs":2,"level":"info","msg":"api_request","time":"2026-09-21T11:35:13.820Z"}
```

Проверено:

- API контракт не изменился: 401 возвращает `{ error }`
- access log — одна JSON-строка
- query string не попадает в `path`
- `x-vercel-id` попадает в `requestId`
- без сессии `userId` отсутствует, как ожидается
- dev server после smoke остановлен

## Шаг 5 — README + финальный отчёт

Сделано: README получил observability-строку рядом с GlitchTip:

- ошибки браузера/сервера → GlitchTip (`@sentry/nextjs`)
- Route Handlers → structured JSON logs в stdout
- `api_request` — access log
- `board_api_error` — ошибки service
- смотреть в Vercel Runtime Logs / Docker logs

Проверки М5.2:

```bash
./node_modules/.bin/vitest run src/server/logger.test.ts src/server/api-log.test.ts
./node_modules/.bin/biome check ...
./node_modules/.bin/tsc --noEmit
```

Локальный smoke:

```bash
ulimit -n 8192 && ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100
curl -i -H 'x-vercel-id: smoke::step4' 'http://127.0.0.1:3100/api/boards?debug=true'
```

## Итог

M5.2 закрыт. Наши REST Route Handlers пишут JSON access logs в stdout, `handleBoardError` больше не использует сырой `console.error`, ошибки service получают тот же request context, что и access log. API-контракт не изменился.

Не делали: внешний log sink (Axiom/Datadog/Loki), OTel, Prisma query log, auth route, логирование AI stream body, новый error UI.

Дальше: М5.3 — Error boundaries.
