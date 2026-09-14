# М3.6 — Оптимизации: font, image, split, startTransition

Имена из плана → код: `next/font` = Geist на `body` через `font-sans`; `next/image` = в UI нет `<img>` (skip); code splitting = `Providers` только в `HydratedKanban`, Devtools через `next/dynamic`; `startTransition` на drag — skip, CUD уже в `form action` / `useOptimistic`. Скрин в README — М3.7.

## Шаг 0 — граница opt

CWV уже в бюджете (М3.5: LCP ≤ 608 ms, INP 16 ms, CLS 0). Цель шага — четыре пункта плана там, где в коде есть гипотеза, не «дожать LCP» и не галочки.

Baseline и повторный замер: `pnpm build && pnpm start --hostname 127.0.0.1`, затем First Load JS из `next build` и `pnpm perf:cwv:suite` (тот же Chrome / slow-4G). Dev и Lighthouse CLI не источник цифр.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| `next/font` | нет | Подключить Geist к `body` (сейчас качается, не красится) |
| `next/image` | нет | Разведка: нет `<img>` → skip, не рисовать логотип ради `Image` |
| Code splitting | нет | Query не на `/` и `/login`; Devtools не в prod-графе |
| Канбан `next/dynamic` | нет | skip: остров уже за Suspense + скелет, CLS 0 |
| `startTransition` на `onDragOver` | нет | skip: transition отложит preview, INP и так 16 ms |
| `next/og` `opengraph-image.tsx` | нет | не `next/image`, не трогаем |
| CWV после правок | нет | контроль регрессии, особенно CLS после шрифта |
| Поле (CrUX), README | нет | мало трафика; скрин — М3.7 |
| Lighthouse в Husky / `pnpm test:e2e` | нет | шумно; GHA — М4 |
| Web Workers, `cacheComponents` / PPR | нет | теория Deep Dive |

Уже в стеке: React Compiler, Suspense/скелеты (М2.8), `next/font` как файлы (не как `font-family`), Query на всём дереве, `useOptimistic` только внутри transition.

Не делать: `next/image` «для галочки», `dynamic(KanbanBoard)`, `startTransition` на DnD, Vercel Analytics, цифры сразу в README. `SuggestSubtasks` режем только если First Load JS доски явно раздут AI SDK.

Порядок: font (CLS) → split (JS витрины); Image и `startTransition` на drag — skip в том же отчёте, не «забыли».

БД для замера доски: локальный Postgres (`127.0.0.1:5433`), не Neon. `AUTH_SECRET`, `nvm use 24`. Husky по-прежнему только lint + typecheck.

Дальше: шаг 1 — `next/font`.

## Шаг 1 — `next/font`

Сделано:

- `body`: `font-sans` (тема уже `--font-sans: var(--font-geist-sans)`). Variables Geist по-прежнему на `<html>`
- С `body` снят `font-family: Arial` — он перекрывал кастомный шрифт, байты Geist качались впустую
- `Geist_Mono` не трогали: `font-mono` на digest в `route-error.tsx`

Проверка: `pnpm lint` + `pnpm build` + `pnpm start` + `pnpm perf:cwv:suite`. В HTML: `class="… font-sans"`. CLS после swap — **0** на четырёх экранах.

| Экран | LCP | CLS | INP | vs М3.5 worst |
| --- | --- | --- | --- | --- |
| `/` | 628 ms, `h1` Nexus | **0** | 16 ms | LCP 592→628, шум |
| `/login` | 192 ms, GitHub button | **0** | 16 ms | ok |
| `/dashboard` | 200 ms, `h1` | **0** | 16 ms | ok |
| доска | 612 ms, email | **0** | 16 ms | LCP 608→612 |

Бюджеты не пробиты. `adjustFontFallback` / `display` не понадобились.

## Шаг 2 — `next/image`

Разведка, не внедрение. Искали потребителя `Image` / `<img>` — нет.

| Что смотрели | Нашли | Вывод |
| --- | --- | --- |
| `next/image`, `<img>` в `src/` | нет | нечем оборачивать |
| `src/app/opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx` | `ImageResponse` (`next/og`) | не UI, не трогаем |
| GitHub-аватар / логотип в канбане | нет, в `UserMenu` текст | `remotePatterns` не этот шаг |
| `public/vercel.svg`, `file.svg`, `window.svg` | нигде не импортятся | хвост create-next-app, удалили |

Не добавляли картинку на `/`, чтобы «закрыть пункт плана». Skip зафиксирован: пункт `next/image` к этому UI не применим.

Проверка: grep, не CWV (UI не менялся). Дальше: шаг 3 — code splitting.

## Шаг 3 — code splitting

Сделано:

- `Providers` (Query) снят с корневого layout. Обёртка только в `HydratedKanban` — `/`, `/login` и список досок без TanStack Query
- Devtools: `next/dynamic` + `src/app/query-devtools.tsx`, `ssr: false`, только `NODE_ENV === "development"` и не `NEXT_PUBLIC_E2E`

Не делали: `dynamic(KanbanBoard)` (остров уже за Suspense). `SuggestSubtasks` не резали: AI SDK не отдельный чанк, First Load доски — один blob ~630 КБ, не «явно AI».

First Load JS = сумма `static/chunks` из `*_client-reference-manifest.js` (Turbopack не печатает таблицу webpack).

| Экран | До | После |
| --- | --- | --- |
| `/`, `/login` | 73 КБ, в манифесте `providers` | **45 КБ**, Query нет (−28 КБ) |
| `/dashboard` | 75 КБ | **49 КБ** |
| доска | 663 КБ | 678 КБ (Providers остался здесь) |

Проверка: `pnpm lint` + `pnpm typecheck` + `pnpm build` + `pnpm test:run` (93) + `pnpm test:e2e` (11, hydrate Query на доске живой).

## Шаг 4 — `startTransition`

Пункт плана — «для тяжёлых UI». Тяжёлое здесь — `onDragOver` → `setDragColumns` каждый кадр в `kanban-board.tsx`. Оборачивать в `startTransition` нельзя: React отложит preview, жест станет рваным. М3.5: blocking на доске 28 ms, клик 16 ms — нечем чинить.

Transition уже есть, где API её требует:

| Место | Механизм | Вывод |
| --- | --- | --- |
| CUD карточки | `form action` + `useOptimistic` (`apply` только внутри transition) | уже |
| `onDragOver` / `onDragStart` | синхронный `setState` | skip, иначе DnD |
| `onDragEnd` persist | `moveCard.mutateAsync`, не optimistic overlay | не transition |
| Web Workers | нет | Deep Dive, не этот шаг |

Явного `startTransition(` в `src/` нет — не добавляли «для галочки». Компилятор включён, кампании `useMemo` нет.

Проверка: grep, не CWV. Дальше: шаг 5 — повторный замер.

## Шаг 5 — повторный замер

Тот же `pnpm start` + `pnpm perf:cwv:suite` после font + split. Код шага 4 не менялся. Все четыре экрана в бюджете. **CLS 0** — Geist без регрессии.

| Экран | LCP М3.5 → шаг 1 → 5 | CLS | INP | Вердикт |
| --- | --- | --- | --- | --- |
| `/` | 592 → 628 → **720 ms**, `h1` Nexus | 0 | 16 ms | pass |
| `/login` | 180 → 192 → **184 ms** | 0 | 16 ms | pass |
| `/dashboard` | 192 → 200 → **188 ms** | 0 | 16 ms | pass |
| доска | 608 → 612 → **616 ms**, email | 0 | 16 ms | pass |

`/` +128 ms к М3.5: TTFB 283 ms (холодный `next start`), не CLS шрифта. Доска blocking 18 ms (было 28). Бюджеты не пробиты.

JS витрины — шаг 3 (−28 КБ). e2e (11) — шаг 3, код с тех пор тот же.

Baseline для README/М3.7: худший LCP этой лабы **720 ms** на `/` (всё ещё ≪ 2.5s).

## Шаг 6 — отчёт и коммиты

M3.6 закрыт. Четыре пункта плана: два сделали, два skip со ссылкой на код.

| Пункт | Итог |
| --- | --- |
| `next/font` | Geist на `body`, CLS 0 |
| `next/image` | skip: нет `<img>`; мёртвые `public/*.svg` удалены |
| code splitting | Query не на `/` / `/login` (−28 КБ); Devtools lazy |
| `startTransition` | skip на `onDragOver`; CUD уже в transition |

Lab после правок: LCP ≤ **720 ms**, INP **16 ms**, CLS **0**. Не клали цифры в README.

Сделано (история на `feature/tests`, без squash, без push):

1. Geist на `body` (`layout` + `globals.css`)
2. Query provider на доску + lazy Devtools
3. отчёт `docs/3/M3-06-opt.md` (skip Image / `startTransition`, удаление svg)

Не делали: логотип ради `Image`, `dynamic(KanbanBoard)`, `startTransition` на DnD, lazy Suggest, Vercel Analytics, Lighthouse в Husky, полевой CrUX.

Husky по-прежнему только lint + typecheck.

Дальше: M3.7 — метрики в README (скрин + цифры).
