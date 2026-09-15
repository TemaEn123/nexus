# М4.2 — multi-stage Dockerfile, slim runner

Имена из плана → код: задача 2 «prod image ~150 MB (только `.next` + prod node_modules)». В Next 16 это **`output: "standalone"`**: оттрейсенный `.next/standalone` (+ `.next/static`, `public`), не полный `node_modules` после `pnpm prune --prod`. Compose M4.1 (`app` + `db`, без Redis) остаётся. GHA — задача 3.

## Шаг 0 — граница slim

Цель: тот же `docker compose up --build` поднимает стек, образ `app` заметно меньше жирного M4.1. Прод по-прежнему Vercel + Neon. Coverage / CWV / e2e в образе — не цель.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Multi-stage Dockerfile | нет | `deps` → `builder` → `runner`; в runner нет pnpm / Playwright / исходников |
| `output: "standalone"` | нет | только в Docker (`DOCKER=1`); хост и Vercel без `output` |
| База runner | нет | `mirror.gcr.io/library/node:24-bookworm-slim` |
| `db` / порты / `.env` | нет | как M4.1: 5433, `@db:5432`, секреты не в yaml |
| `migrate:deploy` | нет | CLI `prisma` в **devDependencies**; в runner его нет. Как накатывать — шаг 4 |
| ~150 MB | ориентир | замер `docker images` до/после; hard fail нет |
| Alpine | нет | Prisma engines — glibc, не musl |
| GHA / preview Vercel | нет | задача 3 |
| Neon / live Vercel | нет | не трогаем `next.config` для прода без флага |
| Redis / nginx | нет | не в плане |
| Playwright в образе | нет | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` на builder; e2e с хоста |
| `prisma` → `dependencies` | нет | не переносим «чтобы slim собрался» |

Не делать: Alpine «ради 40 MB», безусловный `output: "standalone"` (ломает смысл Vercel-сборки), секреты в git, смена 3000/5433, `AUTH_URL`, e2e/Lighthouse в compose, Redis, переписывание Husky.

Образы из РФ: **`mirror.gcr.io`**, не `docker.io` (как M4.1 / M2.4). Builder может остаться `node:24-bookworm`; slim — только **runner**.

Команда onboarding не меняется: `docker compose up --build`, браузер `http://localhost:3000` (не `127.0.0.1`). `HOSTNAME=0.0.0.0` для `node server.js` (standalone), не `pnpm start --hostname`.

Жирный M4.1: один stage, все `node_modules`, `CMD` = `pnpm db:migrate:deploy && pnpm start`. Slim это ломает: в runner нет pnpm и нет CLI Prisma. Пустой volume всё равно должен получить миграции — решение на шаге 4, не «забыть migrate».

`nvm use 24` на хосте. Husky — lint + typecheck.

Порядок: граница → baseline fat → `DOCKER=1` + standalone → Dockerfile → migrate → compose HOSTNAME → `up --build` → README (этот шаг).

## Шаг 1 — baseline fat `nexus-app`

Снято 2026-09-15, образ `nexus-app:latest` `df2757d694bd` (linux/arm64), собран ~22 ч назад (M4.1, жирный одностадийный). Контейнеры `nexus-app` / `nexus-pg` в этот момент были Up — не пересобирали.

| Как мерили | Размер |
| --- | --- |
| `docker images` / `docker system df` UNIQUE | **3.58 GB** |
| `docker image inspect … .Size` | **847 982 183 B ≈ 848 MB** |
| `docker compose images` колонка SIZE | **848 MB** |

Для сравнения после slim — те же две команды (`docker images` и `inspect .Size`). 3.58 GB vs 848 MB — учёт Docker Desktop / snapshotter (развёрнутые слои vs `inspect.Size`); не «два разных образа».

`docker history` (вклад в fat, не сумма = 3.58 GB один-в-один):

| Слой | Размер |
| --- | --- |
| Debian bookworm + apt в `node:24-bookworm` | ~1.0 GB (155 + 52 + 200 + 592 MB) |
| Node 24.21 | 214 MB |
| `corepack` / pnpm 11.21 | 40 MB |
| **`pnpm install --frozen-lockfile`** | **1.35 GB** |
| `pnpm build` | 128 MB |
| `COPY . .` | 1.9 MB |

Вывод: цель ~150 MB бьёт не «чуть prune», а **не тащить Debian-full + весь `node_modules` в runner**. Builder этот слой ещё понадобится; в финальный образ — нет. Playwright-браузеры в history не видны отдельным гигабайтом (скрипты не в `allowBuilds`); 1.35 GB — пакеты, включая Playwright npm и Prisma engines.

Не делали: multi-stage, `standalone`, slim-тег, остановку стека.

## Шаг 2 — `output: "standalone"` только в Docker

Сделано: в `next.config.ts` `output: "standalone"` если `process.env.DOCKER === "1"`. Иначе `undefined` — как раньше: `pnpm build` / `pnpm start` на хосте и сборка Vercel.

Не включали `output` безусловно: Vercel сам пакует serverless, standalone ему не нужен. `outputFileTracingIncludes` для Prisma — не сейчас; добавим, если `node server.js` в runner не найдёт клиент (шаг 3/6).

Проверка: `biome check next.config.ts` + `pnpm typecheck` без `DOCKER` — ок. `DOCKER=1 pnpm build` в образе — шаг 3. Хостовый `pnpm build` не гоняли: без флага `.next` как у M3.

Не делали: Dockerfile multi-stage, `HOSTNAME`, смену `CMD`, перенос `prisma`.

## Шаг 3 — multi-stage Dockerfile

Сделано: `deps` (bookworm + pnpm install, `pnpm-workspace.yaml`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) → `builder` (`DOCKER=1`, `pnpm build`) → `runner` (`node:24-bookworm-slim`, `node` user, `.next/standalone` + `.next/static` + `public`).

`CMD ["node", "server.js"]`, `HOSTNAME=0.0.0.0`, `PORT=3000`. `public/` в git нет — `mkdir -p public` на builder, иначе `COPY` падает. Compose без `build.target`: последняя стадия = runner.

Не копировали CLI Prisma в runner. Старый `pnpm db:migrate:deploy && pnpm start` снят. Пустой volume без шага 4 схему не накатит; текущий `nexus-pg-data` уже после M4.1.

Проверка (без VPN, тег `nexus-app:m42-step3`, `docker compose up` не гоняли): build 21/21, 35 s. `COPY standalone` прошёл — Prisma NFT отдельно не чинили.

| Замер | Fat M4.1 (`latest`) | Slim (`m42-step3`) |
| --- | --- | --- |
| `docker images` (DISK USAGE / раньше SIZE) | 3.58 GB | **422 MB** |
| `inspect .Size` / CONTENT SIZE | 848 MB | **97.4 MB** (97 426 213 B) |

Ориентир ~150 MB закрыт по **content** (97 MB). Disk 422 MB — слои snapshotter, не hard fail. Warning BuildKit `SecretsUsedInArgOrEnv` на `ENV AUTH_SECRET=build-placeholder` в deps — плейсхолдер для generate/build, в runner секрета нет.

Не делали: Alpine, сервис `migrate` в compose, `outputFileTracingIncludes`, запуск контейнера, подмена `latest`.

## Шаг 4 — migrate без Prisma в runner

Сделано: one-shot сервис `migrate` (`build.target: deps`, `command: pnpm db:migrate:deploy`, `restart: "no"`). CLI Prisma остаётся на стадии deps (bookworm + `node_modules`), в slim runner не копировали. `app` ждёт `service_completed_successfully`. `DATABASE_URL` override на `@db:5432`, как у `app` — не `127.0.0.1:5433` из `.env`. `app.build.target: runner` явно.

Не брали вариант «скопировать prisma CLI в runner»: ломает смысл 97 MB и хрупко с pnpm store. `prisma` в `dependencies` не переносили.

Пустой volume: `up` → db healthy → migrate deploy → `node server.js`. Повторный `up`: migrate идемпотентен, exit 0, app стартует.

Проверка: `docker compose config` — сервисы `db`, `migrate`, `app`. Живой `up --build` — шаг 6 (подменит fat `latest`).

Не делали: Alpine, GHA, запуск slim-стека, README.

## Шаг 5 — compose: HOSTNAME и секреты migrate

Сделано: у `app` явно `HOSTNAME=0.0.0.0` и `PORT=3000` — standalone читает их, не флаг `--hostname`. В Dockerfile те же ENV; compose перекрывает, если `.env` когда-нибудь задаст другое. Порты 3000/5433, `container_name`, healthcheck `db` не меняли.

У `migrate` убрали `env_file: .env`: deploy нужен только `DATABASE_URL` на `@db:5432`. Auth/GitHub/AI в one-shot не попадают. У `app` `env_file` остаётся (сессии, OAuth, Suggest). Секреты в yaml нет.

Проверка: `docker compose config --quiet`. `up --build` — шаг 6.

## Шаг 6 — живой `up --build`

Стек поднялся (кэш, ~1 s build). Порядок: `nexus-pg` healthy → `nexus-migrate` `prisma migrate deploy` (4 миграции, pending нет, **exit 0**) → `nexus-app` `Next.js 16.3.0`, Network `http://0.0.0.0:3000`, Ready.

| | Статус |
| --- | --- |
| `GET /` `/login` `/register` | 200 |
| Браузер `http://localhost:3000/` | лендинг Nexus, ссылки Log in / Register / Dashboard |
| `/login` при живой сессии | редирект на `/dashboard`, доски из того же volume |

`nexus-app:latest`: DISK **422 MB**, `inspect.Size` **97.4 MB** — как `m42-step3`. `nexus-migrate` (~3.4 GB disk) — one-shot deps, не runner; в ориентир 150 MB не входит.

Не ловили ошибок Prisma NFT / `server.js`. Suggest / AI Gateway не проверяли (не блокер).

## Шаг 7 — README и закрытие

Сделано: в README секция **Docker (локально)** — `db` → `migrate` → slim `app` (`node server.js`), ~97 MB content, ссылка на этот отчёт. Команда onboarding та же: `docker compose up --build`. Режим только `db` + `pnpm dev` не меняли.

M4.2 закрыт. Прод — Vercel + Neon, без `output: "standalone"`.

Не делали: Alpine, GHA (задача 3), Redis, e2e в compose, перенос `prisma` в `dependencies`, безусловный `standalone`.

Дальше: М4 задача 3 — GitHub Actions.
