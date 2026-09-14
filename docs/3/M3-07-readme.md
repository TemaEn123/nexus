# М3.7 — Метрики в README: скрин Lighthouse + цифры

Имена из плана → код: скрин Lighthouse = Chrome DevTools → Lighthouse на `pnpm start` `/` (тот же Chrome, что e2e; не `npx lighthouse`); цифры = lab `pnpm perf:cwv:suite` после М3.6 (худший LCP **720 ms** на `/`). Не CrUX, не live Vercel из РФ.

## Шаг 0 — граница README

README — витрина для собеса, не второй `M3-05-perf.md`. Один блок: бюджеты плана, lab-таблица, один скрин, как повторить, ссылки на М3.5 / М3.6. Цифры уже сняты; новый suite на этом шаге не обязателен.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Цифры в README | нет | LCP / INP / CLS из М3.6, не «Performance 100» без источника |
| Скрин | нет | DevTools Lighthouse, mobile, `http://127.0.0.1:3000/` на `pnpm start` |
| `npx lighthouse` / PageSpeed live | нет | registry и латентность из РФ (М3.5) |
| Lighthouse в Husky / `pnpm test:e2e` | нет | шумно; GHA — М4 |
| Neon / Vercel как единственный замер | нет | LCP убьёт RTT |
| Полные четыре скрина, Speed Insights | нет | шум |
| PNG в git | нет мока | `docs/3/lighthouse-home.png` |

Не делать: скрин `next dev`, подпись «field data», подгон цифр под скрин. Если Lighthouse и `perf:cwv` разъедутся — два источника подписать отдельно. Не подставлять чужой PSI и не скринить JSON как «Lighthouse».

Скрин `/` (публичная, худший LCP в М3.6). Доску в PNG не тащить. Браузерного MCP нет — DevTools снимает человек, агент вставляет путь.

Если DevTools не взлетит: skip картинки, в README остаётся таблица `perf:cwv`.

Порядок: цифры из М3.6 → скрин DevTools → блок в README (после Live) + `perf:cwv` в таблицу скриптов → коммиты.

`nvm use 24`. Husky по-прежнему только lint + typecheck.

## Шаг 1 — какие цифры

В README — lab **после М3.6** (`docs/3/M3-06-opt.md`, шаг 5), не худший М3.5 (608 ms на доске): продукт уже с Geist и split. Suite заново не гоняли: код с того прогона не менялся.

Таблица в README (худшее по метрике, не четыре экрана):

| | Бюджет | Lab 2026-09-14 |
| --- | --- | --- |
| LCP | &lt; 2.5s | **720 ms**, `/`, `h1` Nexus |
| INP | &lt; 200ms | **16 ms** |
| CLS | &lt; 0.1 | **0** |

Остальные экраны (login 184 / dashboard 188 / доска 616) — в М3.6, не в README. First Load JS (−28 КБ) туда же. Подпись: lab mobile slow-4G, `pnpm start`, не CrUX.

## Шаг 2 — скрин Lighthouse

Цель готова: `pnpm start --hostname 127.0.0.1` отдаёт `/` **200**. PNG **нет** — агент не может открыть DevTools Lighthouse.

Пробовали и отсекли:

| Способ | Результат |
| --- | --- |
| `npx lighthouse` | запрещён границей (registry из РФ, М3.5) |
| Playwright CDP `Lighthouse.start` | домена нет |
| Cursor browser → `127.0.0.1:3000` | about:blank, не тот Chrome |

`docs/3/lighthouse-home.png` появится, когда снимешь в **своём** Chrome:

1. Открой `http://127.0.0.1:3000/` (не `localhost`, не `next dev`)
2. DevTools → **Lighthouse** → Navigation, Mobile, категория Performance
3. Analyze page load → скрин score + LCP/INP/CLS
4. Сохрани как `docs/3/lighthouse-home.png`

Подпись в README: DevTools Lighthouse, не тот же прогон, что таблица `perf:cwv`. Если панель не взлетит — skip картинки, шаг 3 только таблица.

## Шаг 3 — блок в README

Сделано: секция **Core Web Vitals** сразу после Live; в таблицу скриптов — `pnpm start`, `perf:cwv`, `perf:cwv:suite`.

PNG нет — картинку не вставляли (skip шага 2). В README нет «field data» и нет Performance score без источника.

## Шаг 4 — отчёт и коммиты

M3.7 закрыт. В README — lab-таблица после Live; скрин Lighthouse **skip** (DevTools недоступен агенту, PNG в репо нет). Цифры из `pnpm perf:cwv:suite` после М3.6, не CLI и не CrUX.

| | Бюджет | В README |
| --- | --- | --- |
| LCP | &lt; 2.5s | **720 ms**, `/` |
| INP | &lt; 200ms | **16 ms** |
| CLS | &lt; 0.1 | **0** |

Сделано (история на `feature/tests`, без squash, без push):

1. CWV в README + `perf:cwv` в скриптах + отчёт `docs/3/M3-07-readme.md`

Не делали: `npx lighthouse`, PSI live, PNG «из воздуха», Lighthouse в Husky / e2e, полевой CrUX.

Husky по-прежнему только lint + typecheck.

М3 по плану месяца закрыт: unit + integration + e2e + a11y + CWV green + метрики в README. Дальше: М4 (Docker lite + CI/CD).
