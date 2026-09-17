# М4.5 — Dependabot: обновления зависимостей

Имена из плана → код: задача 5 «Dependabot/Renovate для dependency updates». Берём **Dependabot**, не Renovate: нативный GitHub, PR проходят тот же Ruleset (`quality` + `e2e`). Файл: `.github/dependabot.yml`. CI YAML и protection не трогаем.

## Шаг 0 — граница

Цель: раз в неделю бот открывает обычные PR на новые версии пакетов и Actions. Merge руками, только если CI зелёный. Coverage / CWV / Docker-образы — не цель.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Dependabot version updates | нет | `.github/dependabot.yml` |
| npm (pnpm lockfile) | нет | `directory: /`, weekly, limit 5 PR |
| GitHub Actions | нет | bump pin в `ci.yml` |
| Docker / compose images | нет | не в этом шаге (`mirror.gcr.io`) |
| Renovate | нет | не ставим (дубль PR) |
| Auto-merge | нет | merge руками после `quality` + `e2e` |
| Security alerts | нет | включить в Settings; это не version updates |
| `ci.yml` / Ruleset / Husky | нет | не меняем |

Не делать: Dependabot + Renovate вместе, `schedule: daily`, auto-merge / bypass Ruleset для бота, ecosystem `docker`, ignore всех major заранее, группы «всё в один PR».

Почему не Renovate: соло GitHub, бот уже в платформе, история «апдейт = PR + те же checks».

`next` без `^` (`16.3.0`) и `next-auth` beta — Dependabot всё равно откроет PR; major смотреть глазами, не ignore в yaml.

Preview Dependabot-PR пишет в тот же Neon, что прод — как остальные PR. `migrate:deploy` идемпотентен.

Порядок: граница → yaml npm → yaml Actions → Settings GitHub → README.

## Шаг 1 — `dependabot.yml`: npm

Сделано: `.github/dependabot.yml` (`version: 2`).

- `package-ecosystem: npm` — так в схеме GitHub; `pnpm-lock.yaml` подхватывается
- `directory: /`
- `schedule: weekly` + `day: monday`
- `open-pull-requests-limit: 5`

Не добавляли: `docker`, `ignore`, группы, `target-branch` (дефолт `main`). `github-actions` — шаг 2.

Проверка: файл в `main`. Живые PR — шаг 3.

## Шаг 2 — `github-actions`

Сделано: второй блок в том же `.github/dependabot.yml`.

- `package-ecosystem: github-actions`, `directory: /`
- тот же `weekly` / `monday` / limit 5
- смотрит pin в `.github/workflows/ci.yml` (`checkout`, `setup-node`, `pnpm/action-setup`, `upload-artifact`)

Не добавляли: `docker`, auto-merge. PR от бота по-прежнему идут в `main` и ждут `quality` + `e2e`.

## Шаг 3 — Settings GitHub

Сделано руками (не YAML). Не **Secrets and variables → Dependabot** (это credentials для приватных реестров; пусто, так и должно). Нужный экран: **Settings → Advanced Security → Dependabot**.

Version updates включает **файл** `.github/dependabot.yml` на `main`. Кнопка Enable, которая создаёт шаблонный yaml, не нужна.

На странице: alerts, malware alerts, security updates, version updates. Code scanning / Copilot Autofix / push protection — не цель шага.

Проверка (сразу после включения, 2026-09-17): бот открыл **8 PR** — лимит 5 считается **на ecosystem**, не суммарно.

| Ecosystem | PR | Заметка |
| --- | --- | --- |
| npm | 5 (потолок) | `@types/node` 20→26, `next` 16.3.3→16.3.5, `@prisma/adapter-pg` 7.9→7.10, `jsdom` 26→30, `@vitejs/plugin-react` 5→6 |
| github-actions | 3 | `checkout` / `setup-node` / `upload-artifact` 4→7 |

До этой волны уже в `main`: #9 `next` 16.3.0→16.3.3 (патч), #8 `vitest` → 4.1.11 (major; merge под Ruleset `quality` + `e2e`).

Правило merge: руками, только зелёные checks. Major и рассинхрон Prisma (`adapter-pg` без `prisma` / `@prisma/client`) — не мержить «потому что бот открыл». Остальные npm-апдейты ждут, пока не закроется часть из пяти.

Preview Dependabot-PR — тот же Neon, что прод. `migrate:deploy` идемпотентен.

## Шаг 4 — README

Сделано: в блоке CI — weekly PR npm + Actions, merge руками после `quality` + `e2e`, major глазами. Ссылка на этот отчёт.

## Итог

M4.5 закрыт. Код: `.github/dependabot.yml`. Settings не в git. `ci.yml` / Ruleset / Husky не трогали. Renovate не ставили. Ecosystem `docker` нет.

M4 (Docker lite + CI/CD) по плану закрыт: compose, slim image, GHA, Ruleset, Dependabot.

Не делали: auto-merge, ignore всех major в yaml, группы «всё в один PR», Dependabot secrets.
