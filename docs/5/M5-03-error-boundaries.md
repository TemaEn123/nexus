# М5.3 — Error boundaries: graceful UI для server/client errors

Имена из плана → код: задача 3 «Error boundaries: graceful UI для server/client errors». Цель — если UI падает в Server Component или Client Component, пользователь видит аккуратный fallback с понятными действиями, а не технический crash. Sentry/GlitchTip (М5.1) продолжает ловить stack traces; structured logging (М5.2) остаётся для Route Handlers.

## Шаг 0 — граница

Цель: довести существующие App Router error boundaries до production-friendly UX. Ошибка UI → `RouteError` → safe message + `Try again` / navigation action; в production не светим stack/internal details; ошибка продолжает уходить в GlitchTip через `Sentry.captureException`.

Сейчас: базовые boundaries уже есть — `src/app/error.tsx`, `src/app/dashboard/error.tsx`, `src/app/global-error.tsx`, общий UI `src/app/_ui/route-error.tsx`. Это не greenfield-задача, а полировка и проверка поведения.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Root segment error | нет | `src/app/error.tsx`: fallback для `/`, login/register и сегментов под root layout |
| Dashboard segment error | нет | `src/app/dashboard/error.tsx`: fallback внутри dashboard layout, header остаётся |
| Global error | нет | `src/app/global-error.tsx`: fallback при падении root layout, сам рисует `html` / `body` |
| Shared UI | нет | `src/app/_ui/route-error.tsx`: единый компонент ошибки, тексты и действия |
| Sentry capture | нет | оставить один `Sentry.captureException` в `RouteError`, без дублей |
| Production safety | нет | не показывать stack/message в production; максимум безопасный digest |
| Development DX | нет | в dev оставить message, чтобы быстрее дебажить |
| 404 | нет | `not-found.tsx` не смешивать с error boundary; можно только визуально сверить стиль |
| API JSON errors | нет | не трогаем `{ error }` контракт Route Handlers |
| JSON logs | нет | не трогаем М5.2 |
| Rate limit / security / email verify / OTel | нет | задачи 4–7 |

Не делать: временные throw routes в финальном коде; показывать stack trace пользователю; дублировать `captureException` в каждом boundary; менять API error contract; превращать 404 в 500 fallback; добавлять Sentry Replay/Feedback; трогать Auth.js callbacks.

Ключи: **error boundary ≠ logging**. Boundary отвечает за UX после падения UI. Sentry отвечает за stack trace. JSON logs отвечают за Route Handler request history.

Порядок: граница → аудит текущих boundaries → улучшить `RouteError` → проверить root/dashboard/global scenarios → обновить README/этот отчёт.

Проверка шага 0: этот файл.

## Шаг 1 — аудит текущих boundaries

### `src/app/_ui/route-error.tsx`

Сейчас:

- Client Component (`"use client"`)
- общий UI для `error.tsx` / `global-error.tsx`
- в `useEffect` делает `console.error(error)` и `Sentry.captureException(error)`
- в dev показывает `error.message`
- в production скрывает message и показывает общий текст
- если у ошибки есть `digest`, показывает digest в production
- действия: `Try again`; опционально `Home`

Что хорошо:

- capture централизован в одном месте, меньше риска дублей
- production не показывает сырой stack/message
- digest уже есть для связи пользователя/лога/GlitchTip
- есть `retry`, то есть пользователь не обязан вручную обновлять страницу

Что улучшить в следующих шагах:

- убрать или осознанно оставить `console.error` после М5.2 (`RouteError` клиентский, не Route Handler)
- дать компоненту варианты текста под root/dashboard/global
- сделать fallback визуально ближе к остальному UI
- добавить доступные подписи/структуру, чтобы screen reader понимал состояние ошибки
- подумать про вторичное действие `Dashboard` там, где `Home` не лучший выход

### `src/app/error.tsx`

Сейчас:

- ловит throw в сегментах под root layout (`/`, login, register)
- рендерит `RouteError`
- передаёт `homeHref="/"`, поэтому есть кнопка Home

Что улучшить:

- оставить как root-level fallback
- возможно дать более общий текст: «We could not load this page»

### `src/app/dashboard/error.tsx`

Сейчас:

- ловит ошибки dashboard page / dashboard UI
- layout dashboard остаётся
- рендерит `RouteError`
- не передаёт `homeHref`, поэтому сейчас только `Try again`

Что улучшить:

- добавить dashboard-specific copy
- добавить безопасное действие, например переход к `/dashboard` или `/`
- убедиться, что fallback не ломает layout/header

### `src/app/global-error.tsx`

Сейчас:

- ловит падение root layout
- сам рисует `html` / `body`
- заново импортирует `globals.css`
- ставит `<title>Something went wrong</title>`
- рендерит `RouteError` с `homeHref="/"`

Что улучшить:

- оставить минимальным, без зависимостей от root layout
- убедиться, что `RouteError` не требует контекста, который мог упасть вместе с layout
- тексты должны быть максимально общими

### `src/app/not-found.tsx`

Сейчас:

- отдельный 404 UI, не error boundary
- metadata: `robots: { index: false, follow: false }`
- действия: Home и Dashboard

Что улучшить:

- не смешивать 404 с 500 fallback
- можно визуально выровнять кнопки/spacing с `RouteError`, если это не раздует задачу

## Шаг 2 — `RouteError` UI и `scope`

Сделано: `src/app/_ui/route-error.tsx` принимает `scope` вместо `homeHref`.

- `root` — «We could not load this page», `Try again` + Home
- `dashboard` — «We could not load this view», `Try again` + Dashboard
- `global` — «Something went wrong», `Try again` + Home
- production: общий текст и `Reference {digest}`, без `error.message`
- development: `error.message` вместо общего текста
- `role="alert"` на карточке
- `Sentry.captureException` по-прежнему один раз в `RouteError`

Подключено:

- `src/app/error.tsx` → `scope="root"`
- `src/app/dashboard/error.tsx` → `scope="dashboard"`
- `src/app/global-error.tsx` → `scope="global"`

Тест: `src/app/_ui/route-error.test.tsx`.

Не делали: живой throw в браузере, выравнивание `not-found.tsx`, удаление клиентского `console.error`.

## Шаг 3 — браузерный smoke

Сделано на `next dev --hostname 127.0.0.1 --port 3100`. Временные страницы и обход auth удалены, в коде их нет.

- `/error-smoke` (server throw) → root: «We could not load this page», в dev текст `root-smoke`, `Try again` остаётся на том же экране, Home открывает `/`
- `/error-smoke/client` (client throw) → тот же root boundary: «We could not load this page», текст `client-smoke`
- `/dashboard/error-smoke` → dashboard boundary внутри shell: header `Nexus` остаётся, «We could not load this view», ссылка Dashboard. Для гостя дальше срабатывает обычный proxy и открывается `/login`
- throw в root layout → `global-error`: title `Something went wrong`, заголовок тот же, Home, без dashboard header. После удаления throw `/` снова показывает витрину Nexus

В dev вместо общего description виден `error.message`. Digest в production этим smoke не проверяли — это покрывает unit-тест `route-error.test.tsx`.

## Шаг 4 — README и итог

Сделано: в README рядом с GlitchTip и JSON logs есть строка про error boundaries и ссылка на этот отчёт.

## Итог

M5.3 закрыт. Падение страницы показывает `RouteError`, а не технический crash.

- root: «We could not load this page», `Try again`, Home
- dashboard: «We could not load this view», header остаётся, `Try again`, Dashboard
- global: «Something went wrong», свои `html`/`body`, `Try again`, Home
- client throw попадает в тот же boundary сегмента
- production скрывает `error.message` и показывает `Reference {digest}`
- `Sentry.captureException` остаётся один раз в `RouteError`

Не делали: выравнивание `not-found.tsx`, удаление клиентского `console.error`, временные smoke routes в репозитории, изменение API `{ error }`.

Дальше: М5.4 — AI rate limiting.
