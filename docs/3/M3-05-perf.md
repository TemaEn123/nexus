# М3.5 — Performance: Core Web Vitals

Имена из плана → код: LCP / INP / CLS = lab Lighthouse на `pnpm start` (не `next dev`); LCP на `/` — заголовок Nexus (картинок в UI нет); CLS — скелет колонок `ColumnsSkeleton` → `KanbanBoard`; INP — клик/фокус, не полный DnD. `next/image`, code splitting, `startTransition` на drag — М3.6, если разведка не покажет fail. Скрин в README — М3.7.

## Шаг 0 — граница perf

Меряем production-сборку: `pnpm build && pnpm start --hostname 127.0.0.1`. Dev, HMR и Query Devtools портят LCP/INP. Coverage % не цель — бюджеты на тех же четырёх экранах, что axe. Оптимизация вслепую запрещена: сначала цифры.

Бюджеты (план): LCP &lt; 2.5s, INP &lt; 200ms, CLS &lt; 0.1. Основной прогон — **mobile** (slow 4G). Desktop — контроль. INP в лабе часто нет: тогда TBT как прокси + одно взаимодействие (клик Log in / фокус поля), не марафон DnD.

| Слой | Мок | Что проверяем |
| --- | --- | --- |
| Lab CWV на `pnpm start` | нет | LCP, CLS, INP или TBT; какой элемент LCP |
| `/`, `/login` | нет | публичные; `/` без БД |
| `/dashboard`, доска Sprint + карточка | нет, живая сессия | LCP скелет/h1, CLS скелет→колонки |
| Prisma, Auth.js, Route Handlers | нет | — |
| `next/image` | нет, не пилим | в UI нет `<img>` |
| Поле (CrUX, Speed Insights) | нет | мало трафика; скрин README — М3.7 |
| Lighthouse в Husky / `pnpm test:e2e` | нет | шумно; GHA — М4 |
| Neon / live Vercel как единственный замер | нет | латентность из РФ убивает LCP |
| Web Workers, `cacheComponents` / PPR | нет | теория Deep Dive |

Уже в стеке: React Compiler, Suspense/скелеты (М2.8), `next/font` (Geist в `layout`, `body` пока Arial). Канбан-остров и `import` Devtools в `providers.tsx` — кандидаты на разведку, не на фикс до цифр.

`onDragOver` → `setState` каждый кадр не оборачиваем в `startTransition`, пока TBT/INP зелёные.

Не делать: `next/image` «для галочки», динамический импорт всего канбана, Vercel Analytics «чтобы было», Lighthouse на `next dev`, цифры сразу в README.

БД для dashboard/доски: локальный Postgres (`127.0.0.1:5433`), не Neon. `AUTH_SECRET`, `nvm use 24`. Husky по-прежнему только lint + typecheck.

## Шаг 1 — как меряем

Сделано:

- Production: `pnpm build && pnpm start --hostname 127.0.0.1`
- Скрипт `scripts/cwv.mjs` / `pnpm perf:cwv [url]`: Chrome как в e2e (`channel: chrome`), viewport 412×823, CPU 4×, сеть ~slow 4G (150 ms RTT, 1.6 Mbps). LCP/CLS/long task — `PerformanceObserver` с `document`; INP — Event Timing на клик «Log in», не полевой CrUX
- Lighthouse CLI не ставили: `npx lighthouse` с registry виснет (как zip Chromium в М3.3). Не в `pnpm test:e2e`, не в Husky
- Один прогон `/` (без фиксов, не четыре экрана)

| | Бюджет | `/` lab 2026-09-12 |
| --- | --- | --- |
| LCP | &lt; 2.5s | **596 ms**, элемент `h1` «Nexus» |
| CLS | &lt; 0.1 | **0** |
| INP / взаимодействие | &lt; 200 ms | Event Timing `pointerover` **16 ms** (не полный INP) |
| Long tasks (прокси TBT) | — | **3 ms** |
| FCP / TTFB | — | 596 ms / 2 ms |

Проверка: `pnpm perf:cwv` + `pnpm lint`. Dashboard и доска — шаг 2.

## Шаг 2 — разведка четырёх экранов

Сделано: `pnpm start` (тот же prod, что шаг 1) + `pnpm perf:cwv:suite`. Сессия живая: register → dashboard → доска Sprint + карточка `Write e2e`, затем чистый `goto` каждого экрана под throttle. Взаимодействие: `/` — «Log in»; `/login` — поле Email; dashboard — Title; доска — New card. Фиксов продукта нет.

| Экран | LCP (&lt; 2.5s) | CLS (&lt; 0.1) | INP / событие (&lt; 200ms) | Long-task blocking | Вердикт |
| --- | --- | --- | --- | --- | --- |
| `/` | **592 ms**, `h1` «Nexus» | **0** | `pointerover` **16 ms** | 4 ms | pass |
| `/login` | **180 ms**, `p` «No account? Register» | **0** | `pointerover` **16 ms** | 0 | pass |
| `/dashboard` | **192 ms**, `h1` «Dashboard» | **0** | `pointerover` **16 ms** | 0 | pass |
| доска Sprint + Write e2e | **608 ms**, `p` email в шапке | **0** | `pointerdown` **16 ms** | 28 ms | pass |

FCP / TTFB: `/` 592 / 3; login 180 / 24; dashboard 192 / 7; доска 308 / **261** (Prisma + RSC, не бюджет).

Наблюдения, не fail: LCP логина — абзац под формой, не `h1`; LCP доски — email в header, не колонки; скелет → канбан CLS не дал (0). Кандидаты М3.6 по-прежнему гипотеза, не долг шага 3.

## Шаг 3 — только красные метрики

Правило: чинить продукт, только если LCP ≥ 2.5s, CLS ≥ 0.1 или взаимодействие ≥ 200 ms. Наблюдения («не тот LCP-элемент», TTFB доски 261 ms, Geist качается при Arial, `import` Devtools в `providers.tsx`) — не fail.

| Экран | Зазор до бюджета | Фикс |
| --- | --- | --- |
| `/` | LCP 592 / 2500; CLS 0; 16 ms | нет |
| `/login` | LCP 180 / 2500; CLS 0; 16 ms | нет |
| `/dashboard` | LCP 192 / 2500; CLS 0; 16 ms | нет |
| доска | LCP 608 / 2500; CLS 0; 16 ms; blocking 28 ms | нет |

Не трогали (это М3.6, и разведка их не открыла): `next/image`, динамический импорт канбана, `startTransition` на `onDragOver`, вырезание Geist, lazy Devtools, Vercel Analytics.

Diff продукта: пустой. Повторный замер — контроль, не «до/после фикса».

## Шаг 4 — повторный замер

Тот же `pnpm start` + `pnpm perf:cwv:suite`. Код продукта не менялся. Все четыре экрана снова в бюджете.

| Экран | LCP шаг 2 → 4 | CLS | INP | Вердикт |
| --- | --- | --- | --- | --- |
| `/` | 592 → **592 ms**, `h1` Nexus | 0 | 16 ms | pass |
| `/login` | 180 → **180 ms**, `p` Register | 0 | 16 ms | pass |
| `/dashboard` | 192 → **212 ms**, `h1` Dashboard | 0 | 16 ms | pass |
| доска | 608 → **500 ms**, email в шапке | 0 | 16 ms | pass |

Шум лабы: dashboard +20 ms; доска −108 ms (TTFB 261 → 5 — тёплый Postgres/RSC, не ускорение кода). Blocking на доске снова 28 ms. Бюджеты не пробиты.

Baseline для README/М3.7 — худший LCP из двух прогонов: **608 ms** на доске.

## Шаг 5 — отчёт и коммиты

М3.5 закрыт. Бюджеты плана на lab mobile slow-4G:

| | Бюджет | Худший lab (два прогона) |
| --- | --- | --- |
| LCP | &lt; 2.5s | **608 ms**, доска (email в шапке) |
| INP / событие | &lt; 200ms | **16 ms** |
| CLS | &lt; 0.1 | **0** |

Как повторить: `nvm use 24`, `pnpm build && pnpm start --hostname 127.0.0.1`, Postgres `127.0.0.1:5433`, `pnpm perf:cwv` или `pnpm perf:cwv:suite`. Не Lighthouse CLI, не `next dev`, не Husky, не `pnpm test:e2e`.

Сделано (история на `feature/tests`, без squash, без push):

1. lab CWV harness (`scripts/cwv.mjs`, `perf:cwv` / `perf:cwv:suite`)
2. отчёт `docs/3/M3-05-perf.md`

Не делали: фикс продукта (красных метрик не было), `next/image` / split канбана / `startTransition` / Geist / lazy Devtools (М3.6), скрин в README (М3.7), Lighthouse в CI (М4), полевой CrUX, замер с Neon/Vercel из РФ.

Husky по-прежнему только lint + typecheck.

Дальше: M3.6 — оптимизации, только если есть гипотеза из этой разведки, не «для галочки».
