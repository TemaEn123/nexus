# М4.1 — docker-compose: app + db, без Redis

Имена из плана → код: `docker-compose.yml` = сервисы `app` (Next.js) и `db` (Postgres 16); без Redis. Ad-hoc был `nexus-pg` на **5433**. Slim ~150 MB и `output: "standalone"` — М4.2. GHA — задача 3.

## Шаг 0 — граница compose

Цель: `docker compose up --build` поднимает стек локально (onboarding). Прод остаётся Vercel + Neon. Coverage / CWV не цель.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| `db` | нет | Postgres 16, user/db `nexus`, хост **5433**→5432 |
| `app` | нет | Next в контейнере, `:3000`; `DATABASE_URL` на хост **`db`** |
| Redis / nginx / Traefik | нет | не в плане |
| Multi-stage ~150 MB | нет | М4.2 |
| GitHub Actions / preview Vercel | нет | М4 задачи 3–4 |
| Neon / live Vercel | нет | не трогаем |
| Playwright в compose | нет | e2e пока с хоста (`pnpm dev` / `webServer`) |

Не делать: Redis «чтобы было», `network_mode: host`, секреты в git, смена хостового 5433 (на 5432 уже свой Postgres), `AUTH_URL`, e2e внутри compose на этом шаге.

Образы из РФ: **`mirror.gcr.io/library/postgres:16`** и **`mirror.gcr.io/library/node:24-bookworm`**, не `docker.io/library/...` (М2.4: `docker.io` рвался).

Конфликт с живым `nexus-pg`: один слушатель на 5433. Compose либо `container_name: nexus-pg`, либо сначала `docker stop nexus-pg`.

`.env` хоста остаётся `127.0.0.1:5433` для `pnpm dev`. В сервисе `app` override на `postgresql://nexus:nexus@db:5432/nexus?sslmode=disable` (внутри сети порт **5432**).

`HUSKY=0` в образе: `prepare` без `.git` падает. `next start --hostname 0.0.0.0`. Браузер и OAuth — `localhost:3000`. Порт 3000: либо compose `app`, либо `pnpm dev` / Playwright, не оба.

Порядок: `db` → жирный Dockerfile → `app` + healthcheck → README → коммиты.

`nvm use 24` для хоста. Husky по-прежнему только lint + typecheck.

## Шаг 1 — сервис `db`

Сделано: `docker-compose.yml` только с `db`.

- образ `mirror.gcr.io/library/postgres:16`
- `POSTGRES_USER/PASSWORD/DB=nexus`
- хост **5433**→5432
- volume `nexus-pg-data`
- `healthcheck`: `pg_isready -U nexus -d nexus`
- `container_name: nexus-pg` — тот же имя, что ad-hoc

Проверка: `docker compose config` + `docker compose pull db` (mirror ок). Живой ad-hoc `nexus-pg` **не останавливали** — данные на anonymous volume. Первый `docker compose up db -d` требует свободный 5433:

```bash
docker stop nexus-pg && docker rename nexus-pg nexus-pg-adhoc
docker compose up db -d
pnpm db:migrate:deploy
```

Новый volume пустой — `migrate:deploy` накатит 4 миграции. Старый контейнер: `nexus-pg-adhoc`. `.env` хоста по-прежнему `127.0.0.1:5433`.

## Шаг 2 — Dockerfile

Сделано: жирный одностадийный образ, не standalone.

- `Dockerfile`: `mirror.gcr.io/library/node:24-bookworm`, pnpm 11.21, `HUSKY=0`
- `pnpm install --frozen-lockfile` **без** `NODE_ENV=production` — `prisma` в devDependencies, нужен `migrate:deploy`
- `DATABASE_URL` / `AUTH_SECRET` на билд (иначе `db.ts` / `prisma.config` падают). Runtime URL задаст compose
- `CMD`: `pnpm db:migrate:deploy && pnpm start --hostname 0.0.0.0`
- `.dockerignore`: `node_modules`, `.next`, `.git`, `.env`, `e2e`, `docs`

Не делали: Alpine, `output: "standalone"`, prune devDeps (М4.2).

Проверка: `docker build -t nexus-app:m41 .` — слои `node:24-bookworm` с mirror качаются очень медленно (~2 MB / 5 мин, ~350 MB суммарно). Сборку не дожидались.

## Шаг 3 — сервис `app`

Сделано: `app` в `docker-compose.yml`.

- `build: .`, порт **3000:3000**
- `env_file: .env` + override `DATABASE_URL=...@db:5432/...` (не `127.0.0.1:5433` из `.env`)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` (OAuth App)
- `depends_on: db` + `service_healthy`
- `AUTH_SECRET` / GitHub — из `.env`, в yaml нет

Проверка: `docker compose config` — сервисы `db`, `app`. `docker compose up --build` не гоняли: тот же медленный pull Node (шаг 2). Живой `nexus-pg` и занятый `:3000` (`pnpm start` / `dev`) конфликтуют с первым `up`.

## Шаг 4 — README

Сделано: секция **Docker (локально)** — `docker compose up --build`, режим только `db` + `pnpm dev`, порты 3000/5433, прод остаётся Vercel. Не писали, что стек уже проверен `up --build`.

## Шаг 5 — отчёт и коммиты

M4.1 закрыт по файлам. Живой `docker compose up --build` **не доказан** (pull Node из РФ). Yaml `app`+`db` без Redis есть.

Сделано (история на `feature/docker`, без squash, без push):

1. Postgres в compose (`db`, 5433, mirror)
2. жирный Dockerfile + сервис `app`
3. README + `docs/4/M4-01-compose.md`

Не делали: slim ~150 MB (М4.2), GHA, Redis, e2e в compose, остановка живого `nexus-pg`.

Дальше: М4.2 — multi-stage Dockerfile.
