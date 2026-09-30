# М5.4 — Security checklist: CSRF, env, промпт

Имена из плана → код: задача 4 «Security checklist: CSRF, env validation, input sanitization для AI prompts». Цель — не пускать чужой сайт действовать от имени сессии, не стартовать production без обязательных секретов и не склеивать сырой текст карточки в промпт. Groq, rate limit, email verify и OTel — другие пункты М5.

## Шаг 0 — граница

Цель: три проверки, без нового провайдера и без лимита запросов.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| CSRF | нет | аудит Auth.js, Server Actions и REST cookie. Свой токен — только если дыра |
| Env | нет | одна Zod-схема: в production обязательны `DATABASE_URL` и `AUTH_SECRET` |
| AI prompt | нет | чистить title/description карточки перед `suggestSubtasksPrompt` |
| Groq / смена модели | нет | пункт 5.6 |
| Rate limit | нет | пункт 5.8, после живого Groq |
| Email verify / `allowDangerousEmailAccountLinking` | нет | пункт 5.5 |
| OTel | нет | пункт 5.7 |
| Контракт API `{ data }` / `{ error }` | нет | не меняем |

Не делать: CSRF-библиотеку «на всякий случай»; класть секреты в `NEXT_PUBLIC_`; валить сборку из-за пустого Sentry-токена или AI-ключа; брать текст промпта из body запроса.

Порядок: граница → аудит CSRF → схема env → санитизация промпта → тесты → README.

Проверка шага 0: этот файл.

## Шаг 1 — аудит CSRF

Свой CSRF-токен не добавляем. Мутации уже не принимают чужой сайт.

Сессионную cookie мы не переопределяем: в `NextAuth()` нет блока `cookies`. Дефолт Auth.js v5 — `HttpOnly`, `SameSite=Lax`, в production ещё `Secure`. `SameSite=Lax` не отправляет cookie в cross-site `POST` / `PATCH` / `DELETE`. Чужой сайт не может вызвать `/api/boards` или Server Action с нашей сессией.

Три входа:

- **Server Actions** (`src/features/auth/actions.ts`, `src/features/board/actions.ts`). Браузер шлёт их как POST на тот же origin. Next.js сверяет `Origin` с `Host` и отклоняет чужой сайт. Формы login/register/доски идут сюда, не прямым POST в Auth.js.
- **REST** (`src/app/api/**`, кроме auth). Сессия через `requireApiUser()` и ту же cookie. Без cookie ответ 401. Cross-site fetch cookie не получит из-за `SameSite=Lax`. CORS-заголовков, которые разрешили бы чужой origin, нет.
- **OAuth GitHub.** Старт — `signIn("github")` из Server Action. Callback защищён `state` Auth.js, не нашим токеном.

`trustHost: true` не открывает CSRF. Он нужен, чтобы Auth.js собрал callback URL на localhost и Vercel без захардкоженного `AUTH_URL`.

Не этот шаг: `allowDangerousEmailAccountLinking: true` — это склейка аккаунтов, пункт 5.5, не подделка запроса с чужого сайта.

## Шаг 2 — Zod-схема env

Сделано: `src/server/env.ts`.

- `parseEnv` / `getEnv`
- пустая строка считается незаданной
- `DATABASE_URL` обязателен всегда
- `AUTH_SECRET` обязателен только при `NODE_ENV=production`
- GitHub, `AI_GATEWAY_API_KEY` и Sentry остаются необязательными
- `src/shared/lib/db.ts` берёт `DATABASE_URL` из `getEnv()`, поэтому сервер без базы не стартует
- suggest route читает ключ оттуда же: пустой ключ по-прежнему 503
- Docker build не ломается: в `Dockerfile` уже есть `AUTH_SECRET=build-placeholder`
- CI e2e задаёт свой `AUTH_SECRET` до `pnpm build`

Тест: `src/server/env.test.ts`.

## Шаг 3 — текст карточки в промпте

Сделано: `suggestSubtasksPrompt` чистит поля до склейки строки.

- источник по-прежнему карточка из БД, не body запроса
- `SUGGEST_SUBTASKS_INSTRUCTIONS` остаётся системным текстом
- управляющие символы (`\\u0000`–`\\u001F`, DEL), включая переносы внутри поля, становятся пробелами
- title режется до 200, description до 5000 — те же потолки, что у схемы карточки
- пустое после очистки description не попадает в промпт

Тест: `src/features/ai-assistant/prompt.test.ts`.

Не делали: смену провайдера.

## Шаг 4 — README и итог

Сделано: в README рядом с error boundaries есть строка про CSRF, обязательные env и очистку текста карточки. Ссылка на этот отчёт.

## Итог

M5.4 закрыт.

- Чужой сайт не шлёт нашу сессионную cookie: `SameSite=Lax`, Server Actions сверяют `Origin`. Свой CSRF-токен не добавляли
- `src/server/env.ts`: `DATABASE_URL` обязателен всегда, `AUTH_SECRET` — в production. GitHub, AI-ключ и Sentry можно не задавать
- `suggestSubtasksPrompt` берёт title и description из карточки в БД, схлопывает управляющие символы и режет длину до 200 / 5000

Не делали: Groq (пункт 5.6), rate limit (пункт 5.8), подтверждение email (пункт 5.5).

Дальше: М5.5 — Auth hardening.
