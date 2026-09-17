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

Порядок: граница → yaml npm → yaml Actions (этот шаг) → Settings GitHub → README.

## Шаг 1 — `dependabot.yml`: npm

Сделано: `.github/dependabot.yml` (`version: 2`).

- `package-ecosystem: npm` — так в схеме GitHub; `pnpm-lock.yaml` подхватывается
- `directory: /`
- `schedule: weekly` + `day: monday`
- `open-pull-requests-limit: 5`

Не добавляли: `docker`, `ignore`, группы, `target-branch` (дефолт `main`). `github-actions` — шаг 2.

Проверка: файл в репо. Живой PR от бота — после merge в `main` и шага 3 (Settings).

## Шаг 2 — `github-actions`

Сделано: второй блок в том же `.github/dependabot.yml`.

- `package-ecosystem: github-actions`, `directory: /`
- тот же `weekly` / `monday` / limit 5
- смотрит pin в `.github/workflows/ci.yml` (`checkout`, `setup-node`, `pnpm/action-setup`, `upload-artifact`)

Не добавляли: `docker`, auto-merge. PR от бота по-прежнему идут в `main` и ждут `quality` + `e2e`.

## Шаги 3–5

Ещё нет. Дальше: шаг 3 — Settings GitHub (Dependabot version updates + security alerts).
