# М5.6 — Groq вместо Vercel AI Gateway

Имена из плана → код: задача 6 «Groq вместо Vercel AI Gateway». Кнопка Suggest subtasks и стрим `{ subtasks: { title }[] }` остаются. Меняется серверный вызов модели: строка `openai/gpt-4o-mini` ходит в Vercel AI Gateway, её убираем. Промпт, Zod-схема и хук клиента не переписываем. Rate limit — пункт 5.8, после живого Groq.

## Шаг 0 — граница

Цель: ключ Groq только на сервере, без карты в кабинете. Сборка и `next start` без ключа не падают. Пустой ключ по-прежнему 503, кнопка на карточке жива.

Кандидат из примера AI SDK, `moonshotai/kimi-k2-instruct-0905`, в текущем каталоге Groq нет. `llama-3.1-8b-instant` и `llama-3.3-70b-versatile` на странице моделей помечены Enterprise (Contact Sales). Их не берём.

Модель: `openai/gpt-oss-20b`. Она в self-serve каталоге и в списке strict structured outputs (`strict: true`, constrained decoding) вместе с `openai/gpt-oss-120b` и `qwen/qwen3.8-27b`. 20B быстрее и дешевле на коротких title. Если на локальной проверке пункты будут слабыми, запасная модель того же режима — `openai/gpt-oss-120b`. Qwen не берём: preview, каталог может её снять.

`openai/gpt-oss-20b` — reasoning-модель. В вызове ставим `providerOptions.groq.reasoningEffort: "low"`, чтобы список из 3–7 пунктов не сжигал квоту длинной цепочкой рассуждений. Отдельный non-reasoning id со strict JSON Schema в self-serve каталоге сейчас нет.

Ключ: [console.groq.com](https://console.groq.com) → API Keys. Карту не привязываем. Если кабинет с российского IP отвечает 403, один раз открываем его не с российского IP. В проект — `GROQ_API_KEY`, не `NEXT_PUBLIC_`. Локально в `.env`, на проде в env Vercel. Запросы продакшена идут с Vercel на `api.groq.com`. Точные бесплатные лимиты смотрим в кабинете на Limits; в этом пункте свой счётчик не пишем.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Пакет | нет | `@ai-sdk/groq`. `@ai-sdk/openai` не ставим |
| Env | нет | `AI_GATEWAY_API_KEY` заменяем на необязательный `GROQ_API_KEY`. Пустая строка = нет ключа |
| Route | нет | `createGroq({ apiKey })` из `getEnv()`. Модель `openai/gpt-oss-20b`. `streamText` + `Output.object` + текущая схема |
| Reasoning | нет | `reasoningEffort: "low"` |
| Клиент | нет | тот же `POST /api/cards/:id/suggest` и `useObject`. Браузер в Groq не ходит |
| Промпт и Zod | нет | `suggestSubtasksPrompt`, санитизация, `suggestSubtasksSchema` |
| Нет ключа | нет | 503 `unavailable`, текст «AI is not configured. Add GROQ_API_KEY.» |
| E2E | нет | ключ пустой, Groq не вызываем |
| Лог стрима | нет | тело промпта и стрима не логируем |
| Rate limit | нет | пункт 5.8 |
| Отчёты M2 и M5.4 | нет | не переписываем |

Дока Groq пишет, что streaming вместе со Structured Outputs сейчас не поддерживается. Контракт для клиента всё равно текстовый стрим. Если на проверке Groq ответит 400 из-за стрима, сервер соберёт объект и отдаст его тем же `createTextStreamResponse` одним куском. Хук не меняем.

Не делать: привязывать карту; класть ключ в клиент; читать title из body; логировать промпт; лимит запросов; переписывать `use-suggest-subtasks`.

Порядок: граница → пакет и env → route → текст 503, unit и e2e → локальная проверка с ключом → README.

Проверка шага 0: этот файл.

## Шаг 1 — пакет и env

Сделано вместе с шагом 2: route не собрать, пока схема не читает `GROQ_API_KEY`.

- `@ai-sdk/groq` 4.0.37 — та же версия `@ai-sdk/provider`, что у уже стоящего `ai` 7.0.93. Более новый Groq-пакет тащил другой provider, и `tsc` не собирал `streamText`
- `src/server/env.ts`: `AI_GATEWAY_API_KEY` заменён на необязательный `GROQ_API_KEY`. Пустая строка по-прежнему `undefined`
- `.env.example` и `env.test.ts` на то же имя
- Playwright форсирует `GROQ_API_KEY: ""`, чтобы e2e не взял ключ из `.env`

## Шаг 2 — route

Сделано: `src/app/api/cards/[cardId]/suggest/route.ts`.

- `createGroq({ apiKey })` из `getEnv().GROQ_API_KEY`. SDK сам `process.env` не читает
- модель `openai/gpt-oss-20b`, `reasoningEffort: "low"`
- `streamText`, `Output.object`, промпт и схема те же
- нет ключа → 503 «AI is not configured. Add GROQ_API_KEY.»

Проверка шага 2: `env.test.ts` и typecheck route. Живой Groq — шаг 4.

## Шаг 3 — текст 503 и проверки без сети

Сделано.

- `form-error.ts` и `form-error.test.ts`: «AI is not configured. Add GROQ_API_KEY.»
- `e2e/critical-path.spec.ts` ждёт тот же текст и `POST …/suggest` со статусом 503
- Playwright по-прежнему поднимает сервер с `GROQ_API_KEY=""`, поэтому suite не вызывает Groq

## Шаг 4 — локальная проверка

Сделано вручную в `pnpm dev` с ключом в `.env`: Suggest subtasks отвечает, стрим доходит до UI. Запасной кусок одним `createTextStreamResponse` не понадобился. Модель остаётся `openai/gpt-oss-20b`.

## Шаг 5 — README

Сделано. В локальном setup и таблице деплоя ключ — `GROQ_API_KEY`, ссылка на Groq, не `NEXT_PUBLIC_`. Vercel AI Gateway из README убран. Отчёты M2 и M5.4 не переписывались.

М5.6 закрыт. Дальше: М5.7 — OTel, только теория. Rate limit — М5.8, после этого.
