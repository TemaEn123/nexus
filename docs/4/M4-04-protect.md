# М4.4 — Branch protection: required checks before merge

Имена из плана → код: задача 4 «required checks before merge». В репо это GitHub **Ruleset** `Protect main` (не файл в git, не classic Branch protection). Checks: job id из `.github/workflows/ci.yml` — **`quality`** и **`e2e`**. Dependabot — задача 5. YAML CI не меняли.

## Шаг 0 — граница

Цель: в `main` нельзя смержить PR, пока красные или жёлтые `quality` / `e2e`. Прямой push в `main` — только через PR. Coverage / CWV / Docker — не цель.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Ruleset на default branch | нет | Active, target `~DEFAULT_BRANCH` (`main`) |
| Required checks | нет | `quality`, `e2e` |
| Up to date | нет | `strict_required_status_checks_policy` |
| PR before merge | нет | 0 апрувов (соло) |
| Force-push / delete `main` | нет | `non_fast_forward`, `deletion` |
| Vercel Preview | нет | **не** required |
| `ci.yml` / Husky | нет | не трогаем |
| CODEOWNERS / reviewers | нет | не в плане |
| Dependabot | нет | задача 5 |
| Tag / push ruleset | нет | не этот шаг |

Не делать: required Vercel, conversation resolution, CODEOWNERS, linear history, signed commits, target `*` (сломает feature-ветки), дубль classic protection + ruleset.

Имена checks — job id (`quality`, `e2e`), не «CI» и не `CI / quality (pull_request)` из UI PR.

## Шаг 1 — Ruleset в GitHub

Сделано руками (не YAML): **New branch ruleset**, не tag и не import.

Проверка API `GET /repos/TemaEn123/Nexus/rulesets/23590109` (2026-09-17):

| Поле | Значение |
| --- | --- |
| name | `Protect main` |
| enforcement | **active** |
| target | `branch`, include `~DEFAULT_BRANCH` |
| deletion | да |
| non_fast_forward | да (нет force-push) |
| pull_request | да, `required_approving_review_count: 0` |
| CODEOWNERS / conversation resolution / dismiss stale | выкл |
| required_status_checks | **`quality`**, **`e2e`** |
| strict (up to date) | **true** |
| Vercel в checks | нет |
| Bypass list | не задан |

UI: [Ruleset 23590109](https://github.com/TemaEn123/nexus/rules/23590109).

## Шаг 2 — проверка

Правило Active сразу после Create. Открытых PR на момент проверки API не было (M4.3 уже в `main` или закрыт).

Ожидаемое поведение следующего PR в `main`:

- `quality` / `e2e` не зелёные → Merge недоступен
- оба зелёные → Merge можно
- красный Vercel merge **не** блокирует
- `git push origin main` без PR — reject

Не гоняли нарочно красный e2e и прямой push в `main` (шум в историю). Конфиг API совпадает с планом — шаг закрыт по факту ruleset.

## Шаг 3 — README

Сделано: в блоке CI — merge в `main` только после `quality` + `e2e`. Ссылка на этот отчёт.

## Итог

M4.4 закрыт. Кода в `.github/workflows` нет.

Не делали: Dependabot (задача 5), required Vercel, CODEOWNERS, e2e в Husky.

Дальше: М4 задача 5 — Dependabot / Renovate.
