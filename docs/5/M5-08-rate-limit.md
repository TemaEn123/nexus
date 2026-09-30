# М5.8 — AI rate limiting

Имена из плана → код: задача 8 «лимит запросов per user (in-memory или DB counter) на suggest route». Groq уже живой. Лимит только на `POST /api/cards/:id/suggest`. Промпт, Zod-схема, модель `openai/gpt-oss-20b` и хук `useObject` не переписываем.

## Шаг 0 — граница

Цель: один пользователь не выжигает общую бесплатную квоту Groq. 10 запросов на пользователя в календарные сутки UTC. Одиннадцатый — 429, `streamText` не вызывается. Кнопка Suggest остаётся на карточке.

Счётчик — таблица в Postgres. Прод — несколько инстансов Vercel, память одного процесса им не общая. Redis не добавляем.

Лимит — константа в коде, не env. Окно — начало текущих суток UTC (`windowStart`). На пользователя одна строка в сутки. Старые строки не удаляем.

Код ошибки — новый `rate_limited`, статус 429. `unavailable` остаётся только для пустого `GROQ_API_KEY` (503). 429 в GlitchTip не шлём.

Порядок в route: сессия → ключ → своя карточка → резерв лимита → `streamText`. Нет сессии, нет ключа или чужой id квоту не тратят. Попытка, которая уже зарезервирована, не возвращается, даже если Groq потом ответит ошибкой.

Два одновременных клика на границе десятого запроса не должны оба пройти. Резерв: `updateMany` где `count < 10`, затем `increment: 1`. Строки окна нет — `create` с `count: 1`. Гонка на уникальном ключе `(userId, windowStart)` заканчивается 429.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Таблица | нет | `AiRateLimit`: `userId`, `windowStart`, `count`. Ключ `(userId, windowStart)`, связь с `User`. Новая миграция |
| Резерв | мок Prisma | функция вне route. Юнит-тест без живой базы и без Groq |
| Route | нет | резерв перед `streamText`. Не прошёл — `jsonError(429, "rate_limited", …)` и `logger.warn` |
| `ApiErrorCode` | нет | добавить `rate_limited` |
| UI | нет | `suggestError` на `rate_limited` или статус 429 — человеческий текст, без JSON |
| E2E | нет | пустой ключ по-прежнему 503. Лимит после проверки ключа, suite Groq не вызывает |
| In-memory `Map` | нет | не делаем |
| Другие routes | нет | не лимитируем |
| README | нет | одна строка про 10 запросов в сутки и 429 |

Не делать: лимит по IP; Redis; возврат попытки после ошибки Groq; чистку старых окон; вызов модели из теста.

Порядок: граница → миграция → резерв и тест → route → текст 429 → README.

Проверка шага 0: этот файл.

## Шаг 1 — таблица

Сделано: модель `AiRateLimit` в `prisma/schema.prisma`, миграция `20260930140523_ai_rate_limit`.

- поля `userId`, `windowStart`, `count`
- первичный ключ `(userId, windowStart)`
- `user` с `onDelete: Cascade`
- на `User` обратная связь `aiRateLimits`
- миграция применена к локальной базе `127.0.0.1:5433`

Проверка шага 1: `prisma migrate dev` создал и применил SQL. Резерв лимита — шаг 2.

## Шаг 2 — резерв

Сделано: `src/features/ai-assistant/rate-limit.ts`. Route ещё не вызывает.

- `SUGGEST_DAILY_LIMIT = 10`
- `suggestWindowStart` — полночь UTC
- `reserveSuggestAttempt`: `updateMany` при `count < 10` и `increment: 1`; если строки нет — `create` с `count: 1`
- гонка `P2002` → `false`. Другая ошибка создания пробрасывается
- `true` — попытка зарезервирована и не откатывается

Тест: `src/features/ai-assistant/rate-limit.test.ts`, 5 кейсов, Prisma замокана. Живой базы и Groq нет.

Проверка шага 2: vitest этого файла. Подключение к suggest route — шаг 3.

## Шаг 3 — route

Сделано: `POST /api/cards/[cardId]/suggest`.

- после своей карточки и до `streamText` вызывается `reserveSuggestAttempt`
- `false` → `logger.warn("suggest_rate_limited")` и 429 `rate_limited`, текст «Daily suggestion limit reached. Try again tomorrow.»
- в `ApiErrorCode` добавлен `rate_limited`. `unavailable` по-прежнему только 503 без ключа
- 404 и пустой ключ до резерва не доходят. Ошибка базы в резерве идёт в `handleBoardError`

## Шаг 4 — текст 429

Сделано: `suggestError` на код `rate_limited` или статус 429 возвращает «Daily suggestion limit reached. Try again tomorrow.» Сырой JSON по-прежнему не показывается.

E2E `critical-path` не менялся: пустой `GROQ_API_KEY` отвечает 503 до резерва лимита.

Проверка шага 4: `form-error.test.ts`. README — шаг 5.

## Шаг 5 — README

Сделано. В блоке observability: 10 запросов на пользователя в сутки UTC, сверх лимита 429, Groq не вызывается. Ссылка на этот отчёт.

М5.8 закрыт. Лимит только на suggest route, счётчик в Postgres, кнопка при 429 остаётся и показывает дневной лимит.
