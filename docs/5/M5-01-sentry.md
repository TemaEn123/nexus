# М5.1 — Sentry SDK + GlitchTip: frontend + server, source maps

Имена из плана → код: задача 1 «Sentry: frontend + server errors, source maps в production». SDK: **`@sentry/nextjs`**. Приёмник событий: **GlitchTip Cloud** (`app.glitchtip.com`), не sentry.io — из РФ кабинет Sentry недоступен даже через VPN. Прод — Vercel, не Docker. `ci.yml` / Husky / Ruleset не трогаем. JSON-логи, новый UI ошибок, rate limit — другие задачи М5.

## Шаг 0 — граница

Цель: ошибка на live Vercel (браузер или сервер) → событие в **GlitchTip** со стеком `src/...`, не `app-abc.js:1:42891`. Карты исходников заливаются на билде **в GlitchTip** (`sentryUrl`) и **не** лежат в публичных ассетах. Coverage / CWV / Replay / OTel / self-host Sentry — не цель.

Почему не SaaS Sentry: шаг 1 на sentry.io из РФ не выполнить. Протокол тот же — в коде `Sentry.init` / `withSentryConfig`, DSN и upload указывают на GlitchTip. На собесе: «Sentry-совместимый SDK, source maps; приёмник — GlitchTip».

Сейчас: `error.tsx` / `global-error.tsx` → `RouteError` пишет `console.error`. `instrumentation.ts` нет. Логи Vercel не заменяют читаемый клиентский стек.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Приёмник | нет | GlitchTip Cloud, не sentry.io |
| Self-host GlitchTip / Sentry OSS | нет | только если cloud тоже недоступен |
| `@sentry/nextjs` | нет | client + Node + edge; тот же пакет |
| `sentryUrl` | нет | в `withSentryConfig` — хост GlitchTip, иначе карты уедут на sentry.io |
| `instrumentation.ts` | нет | `register` + `onRequestError` (без него часть RSC не уйдёт) |
| `instrumentation-client.ts` | нет | браузер (имена файлов как у SDK; не `sentry.client.config` из старой доки GlitchTip, если wizard/доки Next 16 требуют `instrumentation-client.ts`) |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | нет | Node и `proxy.ts` |
| `RouteError` / `global-error` | нет | `Sentry.captureException`, UI не меняем |
| Source maps | нет | upload на `next build` (Vercel) → GlitchTip, затем удалить `.map` |
| DSN | нет | runtime, хост GlitchTip; `NEXT_PUBLIC_SENTRY_DSN` в бандле — норма |
| `SENTRY_AUTH_TOKEN` | нет | токен GlitchTip; только Build на Vercel, не git, не `NEXT_PUBLIC_` |
| Preview | нет | М5.1 — Production; Preview без token/DSN ок |
| `npx @sentry/wizard` | нет | регистрирует sentry.io и Replay |
| Session Replay / Feedback | нет | у GlitchTip нет; в SDK не включаем |
| Tunnel (`tunnel` / `tunnelRoute`) | нет | не шаг 0; позже, если браузер из РФ не достучится до ingest |
| JSON-логи | нет | задача 2 |
| Error UI | нет | задача 3; красный экран уже с М1 |
| AI rate limit / security / email verify | нет | задачи 4–6 |
| OTel | нет | задача 7, теория |
| `ci.yml` / Husky / Ruleset | нет | не меняем |
| Docker slim | нет | compose/`pnpm build` без токена должен проходить |

Не делать: аккаунт на sentry.io; wizard Sentry; токен в клиенте; `productionBrowserSourceMaps` без upload+delete; падение CI или Docker-сборки без токена; Replay; слать пароли/тела логина; required check «Sentry»; отдельный проект на каждый Preview; поднимать self-host Sentry (~16 GB).

Ключи: **DSN** — куда слать события (хост GlitchTip, в бандле будет виден). **Auth token** — заливка карт в org GlitchTip (секрет билда). Org/project slug + **`sentryUrl`** в `withSentryConfig` — не секреты. Нет DSN — SDK молчит (dev, GHA `e2e`, compose).

Карты: build на Vercel забирает `.map` → upload на GlitchTip → `deleteSourcemapsAfterUpload`. Браузер качает только минифицированный JS; читаемый стек — в UI GlitchTip. Next 16 + Turbopack на Vercel может класть чанки в `static/immutable/` — нужен свежий `@sentry/nextjs`.

Не ломаем: `reactCompiler` и `output` только при `DOCKER=1` в `next.config.ts`. `withSentryConfig` оборачивает существующий конфиг.

Порядок: граница → аккаунт GlitchTip → SDK → `captureException` → `withSentryConfig` → env Production → PR в `main` → живой throw на проде → README.

Проверка шага 0: этот файл. Пакета и env на Vercel ещё нет.

## Шаг 1 — аккаунт GlitchTip (руками)

Сделано руками (не код). Cloud открылся. Wizard Sentry не запускали.

В блокноте (не в git): org slug, project name/slug, DSN (хост GlitchTip), Auth Token (`next-soutcemaps` — имя ярлык, опечатка не важна). Team — только уведомления, в `withSentryConfig` не идёт.

**Security endpoint** в Project Settings — это не DSN для SDK (часто CSP `/api/…/security/`). В `Sentry.init` кладём **DSN** `https://…@<хост-glitchtip>/…`, не security endpoint.

`sentryUrl` для карт = origin из DSN (обычно `https://app.glitchtip.com`), без `/` в конце.

Token и DSN в чат не присылали — так и надо. Env на Vercel — шаг 5.

## Шаг 2 — SDK `@sentry/nextjs`

Сделано: пакет `@sentry/nextjs` ^10.75. Wizard не запускали. Replay / Feedback нет. `tracesSampleRate: 0` (квота GlitchTip Free).

- `src/instrumentation-client.ts` — браузер
- `src/sentry.server.config.ts` / `src/sentry.edge.config.ts` — Node и edge
- `src/instrumentation.ts` — `register` + `onRequestError`
- `getSentryDsn()` — `NEXT_PUBLIC_SENTRY_DSN` или `SENTRY_DSN`; пусто → `init` нет
- `.env.example` — пустые DSN
- `pnpm-workspace.yaml`: `@sentry/cli: true` (pnpm 11 allowBuilds)
- Docker: `SENTRYCLI_SKIP_DOWNLOAD=1` (карты не с compose)

Не делали: `withSentryConfig` / upload maps (шаг 4), `captureException` в `RouteError` (шаг 3), env на Vercel, пример-страница throw.

Проверка: `pnpm typecheck` + `pnpm lint`. Без DSN в `.env` SDK молчит.

## Шаг 3 — `captureException` в boundary

Сделано: в `RouteError` `useEffect` — `console.error` + `Sentry.captureException`. UI не меняли.

`error.tsx` (root + dashboard) и `global-error.tsx` уже рендерят `RouteError` — второй `captureException` в `global-error` дал бы дубль. Без DSN `captureException` no-op.

Не делали: новый empty state (задача 3 М5), throw-кнопка, `withSentryConfig`.

## Шаг 4 — source maps (`withSentryConfig`)

Сделано: `next.config.ts` обёрнут в `withSentryConfig` из `@sentry/nextjs/config`. `reactCompiler` и `output` только при `DOCKER=1` на месте.

- `sentryUrl` — `SENTRY_URL` или `https://app.glitchtip.com` (не дефолт sentry.io)
- org / project / token — из `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (не хардкод, не git)
- без токена: `sourcemaps.disable` — CI и Docker `pnpm build` как раньше
- с токеном: upload, `deleteSourcemapsAfterUpload`, assets `.next/server` + `.next/static` (в т.ч. `immutable`)
- `telemetry: false` — плагин не стучит в sentry.io
- `release.finalize: false` — GlitchTip это плохо переносит

`.env.example`: пустые token/org/project + `SENTRY_URL`. Значения на Vercel — шаг 5.

Проверка: `pnpm typecheck` + `pnpm lint`. Живой upload — после env на проде.

## Шаг 5 — env Vercel Production

Сделано руками. Production: `NEXT_PUBLIC_SENTRY_DSN` (префикс оставить, в UI это Config, не Secret), `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` только **Build**, `SENTRY_ORG=nexus-6t`, `SENTRY_PROJECT=nexus`, `SENTRY_URL=https://app.glitchtip.com`. Preview не заполняли. `.env` в git не кладём.

Код М5.1 в `main`, Production задеплоен. Throw в `page.tsx` в коммите нет.

## Шаг 6 — живой throw на проде

Сделано: на live ловились `glitchtip-smoke-prod-server` и `glitchtip-smoke-prod-browser`. Каталог `src/app/glitchtip-smoke` удалён — не оставляем boom в проде.

Рядом был `Minified React error #441` — это **текст** ошибки React в production (без dev overlay), не провал source maps. Побочный эффект error boundary / RSC throw. Smoke в GlitchTip можно Resolve.

## Шаг 7

Ещё нет. README: ошибки прода → GlitchTip, карты не публичные.
