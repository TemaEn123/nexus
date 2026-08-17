# Стек M1 — шпаргалка к собеседованию

Фронтенд-разработчик, проект **Nexus** (Next.js App Router). Ниже — технологии шагов 1–3: что это, зачем, почему не сосед, что нового, как сказать на собесе.

Версии в репо (ориентир): React **19.2.8** · Next.js **16.3.0** · React Compiler **1.0.0** · Biome **2.4.2** · Husky **9** · pnpm **11** · Prisma **7.9** · Postgres/Neon · Auth.js v5 (`next-auth@5.0.0-beta.32`) · bcryptjs **3** · Zod **4**.

Как отвечать: сначала **зачем в продукте**, потом **trade-off**, потом **что делал руками**. Не «я знаю библиотеку» — «я выбрал X, потому что Y, цена — Z».

---

## Шаг 1 — фундамент

### React 19

**Что это и зачем.** UI-библиотека: компоненты, состояние, сверка с DOM (reconciliation). В 19 акцент на **Actions** (формы → сервер без своего fetch-слоя), `use()`, `useActionState`, `useOptimistic`, `ref` как обычный prop, metadata в Document. Нужна, чтобы собирать интерактивный UI предсказуемо, а не вручную трогать DOM.

**Почему не Vue / Svelte / «чистый» JS.** Рынок вакансий, экосистема (Next, React Query, dnd-kit), RSC в Next завязаны на React. Vue Comp API ближе по DX; Svelte меньше рантайма. Для портфолио и собесов в 2026 React — дефолт. Классовые компоненты не используем.

**Что нового (18 → 19).**

| 18 | 19 |
| --- | --- |
| Concurrent, `useTransition`, `useDeferredValue`, automatic batching | Actions: форма может вызывать async-функцию на сервере |
| `useId`, Strict Mode double-invoke | `useActionState` (бывший `useFormState`), `useOptimistic` |
| `startTransition` для тяжёлого UI | `use(promise)` — читать Promise/Context в рендере |
| — | `ref` больше не только `forwardRef` |
| — | лучше гидрация и ошибки form/document |

В Nexus пока мало клиентского React: RSC по умолчанию, формы логина — Server Actions, без `"use client"`, пока не нужен pending/UX.

**На собесе.** «React 19 в Next 16. UI — Server Components, интерактив появятся в канбане. Actions уже на login/register: `action={login}` без клиентского fetch. Compiler включён, лишний `useMemo` не пишу.»

---

### React Compiler

**Что это и зачем.** Компилятор (Forget): на сборке сам ставит мемоизацию пропсов/компонентов. Раньше `useMemo` / `useCallback` / `React.memo` руками — легко ошибиться или перебдеть.

**Почему не «везде memo вручную».** Ручная мемоизация шумит в диффе и часто бесполезна (дешёвый рендер). Compiler закрывает 80% случаев. `useMemo` остаётся, когда зависимость — тяжёлый расчёт и компилятор это не вытянет, или нужна стабильная ссылка наружу (не в React-дерево).

**Что нового.** Статус **1.0** (в репо `babel-plugin-react-compiler`). В Next: `reactCompiler: true` в `next.config.ts`. Работает с React 19. Не «новая библиотека» — плагин сборки.

**На собесе.** «Включил React Compiler 1.0 в Next. Правило: не пишу `useCallback` по привычке. Когда дойду до DnD и частых ререндеров — сначала Profiler, потом точечный memo, если Compiler не хватит.»

---

### Next.js 16

**Что это и зачем.** Фреймворк над React: маршруты, SSR/RSC, бандлы, Route Handlers, деплой на Vercel. **App Router** (`src/app`): файл = URL, Server Component по умолчанию, `"use client"` только для браузерных API / стейта / обработчиков.

Зачем фронту: SEO, быстрый TTFB, секреты и БД не в бандле, один репо UI+API.

**Почему не Vite SPA / Remix / Nuxt.** SPA сама не даёт RSC и нормальный SSR из коробки. Remix близок по loader/action. Nuxt — Vue. Next — стандарт вакансий + App Router, который мы учим. Pages Router (`src/pages`) **не** добавляем: Next решит, что это Pages.

**Что нового (App Router → 15 → 16).**

- **15:** `params` / `searchParams` — Promise, `await searchParams`; лучше кеш; Turbopack стабильнее.
- **16:** `middleware.ts` → **`proxy.ts`**, runtime **Node**, не Edge. Auth.js в proxy может импортировать Node-код (Prisma) без старого Edge-split, хотя бандл всё равно лучше не раздувать. Turbopack — дефолт `next dev`. React 19.2. `next typegen` генерирует `PageProps<"/login">`, `LayoutProps`.

В Nexus: `src/app`, `src/proxy.ts` (не middleware), Route Handler `/api/auth/[...nextauth]`.

**На собесе.** «Next 16 App Router. Страницы — RSC, auth-эндпоинты — Route Handlers, защита — `proxy.ts` на Node. Сессию в RSC читаю через `auth()`, не `getServerSession` из v4 и не `useSession` на сервере.»

---

### Biome

**Что это и зачем.** Один инструмент: **lint + format** (Rust). Замена связки ESLint + Prettier. Быстрее, один `biome.json`.

**Почему не ESLint + Prettier.** Меньше плагинов и конфликтов format vs lint. Для учебного/продуктового фронта 2026 Biome закрывает recommended + домены `next` и `react`. ESLint оставляют, когда нужны узкие плагины (кастомные a11y-правила, storybook), которых в Biome ещё нет.

**Что нового (1.x → 2.x).** Ассисты (organize imports), CSS и `tailwindDirectives`, `domains.next` / `domains.react`, лучше JS/TS. В Nexus: `pnpm lint` = `biome check .`, generated Prisma в ignore.

**На собесе.** «Biome 2 вместо ESLint/Prettier. Pre-commit гоняет `biome check` и typecheck. Если на собесе спросят про ESLint — знаю, в проекте сознательно одно тулчейн.»

---

### Husky

**Что это и зачем.** Git-hooks в репо. У нас `pre-commit`: `pnpm lint` + `pnpm typecheck`, чтобы в main не уезжал красный код.

**Почему не lefthook / simple-git-hooks / только CI.** Husky привычен, `prepare` ставит хуки после `pnpm install`. Lefthook быстрее на больших монорепо. CI всё равно нужен: хук можно обойти. В Cursor Source Control хуки иногда **не** бегут — коммитим из терминала.

**Что нового (8 → 9).** Проще конфиг: файлы в `.husky/`, без громоздкого `husky install` как раньше. `package.json` → `"prepare": "husky"`.

**На собесе.** «Husky 9, pre-commit lint+typecheck. Не замена CI, а быстрый локальный стоп. Знаю, что GUI может хуки не вызвать.»

---

### FSD (Feature-Sliced Design) — у нас FSD-lite

**Что это и зачем.** Методика папок фронта: слои `app` → `processes` → `pages` → `widgets` → `features` → `entities` → `shared`, импорты только вниз. Цель — чтобы фича (auth, board) не расползалась по `components/`.

**Почему не полный FSD и не «все в components/».** Полный FSD тяжело на старте: пустые `entities`/`widgets` путают. Классический `components/ui` + `hooks` через полгода становится свалкой. **FSD-lite:** слои **только с кодом**. Сейчас: `src/app` (роутер Next), `src/features/auth`, `src/shared/lib`, `src/server`. Не `src/pages` — конфликт с Pages Router.

**Что нового.** Сама методология не «версионируется как npm». В 2024–2026 чаще берут **облегчённый** FSD + фреймворк (Next app = слой app). Это и есть наш выбор из плана.

**На собесе.** «Не догматичный FSD. Фичи кладу в `features/`, общее в `shared`, Next-роуты в `app`, серверный auth в `server`. Пустые слои не пложу. Импорт Prisma на клиент запрещён (`server-only`).»

---

### pnpm

**Что это и зачем.** Менеджер пакетов: один content-addressable store, в проекте — симлинки. Быстрее npm, меньше дублей на диске, **строгий** граф зависимостей (нет случайного доступа к непрямому пакету).

**Почему не npm / Yarn.** npm тянет тяжёлый `node_modules` и дырявые hoist. Yarn 1 — legacy; Yarn Berry — Plug’n’Play, боли с нативными пакетами. pnpm — дефолт многих монорепо. В Nexus `packageManager: pnpm@11.21.0`.

**Что нового (9 → 10/11).** Жёстче supply-chain: **`allowBuilds`** — какие пакеты могут гонять postinstall/native build. Prisma engines без разрешения не соберутся. У нас в `pnpm-workspace.yaml`: `prisma` и `@prisma/engines` разрешены.

**На собесе.** «pnpm 11, не npm. Для Prisma явно разрешил native builds. Строгий node_modules ловит скрытые импорты.»

---

## Шаг 2 — данные

### PostgreSQL

**Что это и зачем.** Реляционная БД: таблицы, FK, транзакции, JSONB. Канбан — граф **User → Board → Column → Card**; SQL хорошо держит целостность (`onDelete: Cascade`).

**Почему не Mongo / SQLite / MySQL как «основная».** Mongo удобен для документов, слабее на жёстких связях и JOIN. SQLite — локально/мобильно, не наш managed-прод. MySQL ок, экосистема Prisma+Neon заточена под Postgres. Фронту Postgres важен как **контракт домена**, не как «я DBA».

**Что нового (в широком смысле 14–17).** JSON/JSONB, `RETURNING`, generated columns, лучше логическая репликация, RLS (политики на строки — тема для multi-tenant позже). Для собеса достаточно: ACID, индексы на FK (`ownerId`, `boardId+position`), unique email.

**На собесе.** «Домен реляционный, не документный. Индексы под будущий DnD по `position`. Email unique. Каскад: удалил board — колонки и карточки ушли.»

---

### Neon

**Что это и зачем.** Managed **serverless Postgres**: ветки БД, scale-to-zero, URL из консоли. Не поднимаем Docker Postgres на ноутбуке (это М4).

**Почему не Supabase / RDS / свой Docker сейчас.** Supabase = Postgres + Auth + Realtime; у нас свой Auth.js. RDS — тяжелее для учебы. Docker-Postgres будет в М4 для онбординга. Neon близко к прод-Vercel.

**Нюанс, который спрашивают.** Два хоста: **direct** (миграции, Prisma migrate) и **pooler** (`-pooler`, PgBouncer, много serverless-инстансов). В M1.2 — Direct URL, хост **без** `-pooler`. Иначе migrate может странно падать.

**Что нового.** Branching БД как git, Neon Auth/Auth.js гайды, Prisma Postgres в экосистеме Prisma — мы остаёмся на «свой Prisma + Neon URL».

**На собесе.** «Postgres на Neon, Direct URL для migrate. Знаю разницу pooler vs direct. Секреты только в `.env`, в git — `.env.example`.»

---

### Prisma 7

**Что это и зачем.** ORM: схема `schema.prisma` → миграции SQL → типизированный клиент. Пишем `prisma.user.findUnique`, не сырой SQL на каждый CRUD. Для фронта — **единые типы** с API.

**Почему не Drizzle / TypeORM / Kysely / raw SQL.** Drizzle легче и ближе к SQL — частый конкурент 2025–26. TypeORM тяжелее, декораторы. Kysely — query builder без полной схемы-миграций из коробки. Prisma: миграции, Studio, понятный DX. Цена: абстракция и (в v7) обязательный driver adapter.

**Что нового (6 → 7) — важно на собесе.**

| Prisma 6 | Prisma 7 |
| --- | --- |
| `provider = "prisma-client-js"`, клиент из `@prisma/client` | `provider = "prisma-client"`, `output` в репо (`src/generated/prisma`) |
| URL часто в `schema.prisma` | `prisma.config.ts` + `env("DATABASE_URL")` |
| Драйвер внутри клиента | **Обязателен adapter** (`@prisma/adapter-pg` + `pg`) |
| `new PrismaClient()` | `new PrismaClient({ adapter })` |

В Nexus: singleton в `src/shared/lib/db.ts`, `import "server-only"`, в dev кладём клиент на `globalThis` (HMR не плодит пулы).

**На собесе.** «Prisma 7, не 6: driver adapter и generated client не из дефолтного `@prisma/client`. Клиент только на сервере. Studio смотрел связи User–Board–Card.»

---

## Шаг 3 — auth и валидация

### Auth.js (NextAuth v5)

**Что это и зачем.** Библиотека аутентификации: OAuth, Credentials, сессия, CSRF, callback URL. Пакет всё ещё `next-auth`, линейка **v5 / Auth.js**. Стабильной `next-auth@5` на npm нет — ставят `next-auth@beta` (`5.0.0-beta.32`).

В Nexus: `NextAuth()` в `src/server/auth.ts` → `handlers`, `auth`, `signIn`, `signOut`. Handlers — `app/api/auth/[...nextauth]/route.ts`. Кастомные `/login`, `/register`.

**Почему не Clerk / Lucia / свой JWT / Better Auth.** Clerk — быстрее в прод, вендор и цена. Свой JWT — легко сломать CSRF/cookie. Better Auth активно пушат (сайт Auth.js даже намекает) — **в плане зафиксирован Auth.js v5**, не мигрируем. Lucia — библиотека сессий, больше ручной работы. Auth.js — стандарт Next, много вакансий «NextAuth».

**Что нового (v4 → v5).**

| v4 | v5 |
| --- | --- |
| `NextAuth(authOptions)` в API route, `getServerSession(authOptions)` | один `auth.ts`, экспорт `auth()`, `signIn`, `handlers` |
| `NEXTAUTH_*` | `AUTH_SECRET`, `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (infer) |
| `middleware` из `next-auth/middleware` | `auth()` как wrapper; в Next 16 файл **`proxy.ts`** |
| адаптеры `@next-auth/*` | `@auth/prisma-adapter` |

Credentials **не умеет** database-сессии → у нас явно `session: { strategy: "jwt" }`, иначе `UnsupportedStrategy`. Adapter всё равно создаёт User/Account на GitHub.

**На собесе.** «Auth.js v5, не v4: `auth()` в RSC, не `getServerSession`. JWT + PrismaAdapter. GitHub и email/password. Proxy режет `/dashboard`, на странице ещё `requireUser()`. Хеш в JWT не кладу.»

---

### Авторизация: session, JWT и соседние техники

Путают **authentication** (кто ты) и **authorization** (что можно). Ниже — как держат «ты это ты» между запросами.

**Cookie session (server-side, `strategy: "database"`).** Сервер кладёт случайный `sessionToken` в cookie, запись в таблице `Session`. Каждый `auth()` — запрос в БД (плюс кеш). Плюс: можно **отозвать** сессию (удалил ряд — все устройства выкинуты). Минус: нагрузка на БД, нужен Edge-совместимый адаптер, если сессию читают на Edge. Credentials в Auth.js это **не** поддерживает.

**JWT / JWE (у нас).** После логина Auth.js кладёт **зашифрованную** cookie (не «голый» JWT в localStorage). `auth()` расшифровывает cookie, в БД за сессией не ходит. Плюс: быстро, просто с Credentials. Минус: logout = удалить cookie; серверно все устройства не убить без blacklist. `token.sub` = user id → копируем в `session.user.id`.

**access + refresh tokens (классика OAuth/API).** Короткий access, длинный refresh. Типично для мобилок и сторонних API, не для first-party cookie-сессии браузера.

**localStorage JWT.** Удобно для демо, плохо: XSS крадёт токен, нет CSRF-модели cookie. Для веб-приложения с своим бэкендом — anti-pattern.

**Где что в Next.**

| Место | Что делать |
| --- | --- |
| `proxy.ts` | cookie есть? редирект. Не бизнес-авторизация |
| RSC / Server Action | `auth()` / `requireUser()` |
| Route Handler API | `requireUser()`, сверка `ownerId` (М1.4) |
| Клиент | `useSession` только с SessionProvider; мы **не** подключали |

**На собесе.** «Сравнил database session и JWT. Выбрал JWT, потому что Credentials. Таблица Session в схеме есть под адаптер, почти не пишется — так и задумано. Защита двойная: proxy + RSC. API без проверки сессии не отдам.»

---

### OAuth (GitHub)

**Что это и зачем.** Стандарт: «войти через GitHub», пароль GitHub мы **не** видим. Authorization Code: редирект на GitHub → пользователь соглашается → callback с `code` → сервер меняет code на tokens. Redirect URI должен **байт-в-байт** совпасть с OAuth App (`http://localhost:3000/api/auth/callback/github`). `127.0.0.1` ≠ `localhost`.

**Почему GitHub, не только пароль.** Меньше паролей в нашей БД, привычный UX для девов, демонстрирует OAuth. Пароль всё равно нужен (план: login/register).

**Связка аккаунтов.** Auth.js по умолчанию **не** клеит OAuth к существующему email (особенно если `emailVerified` пустой) — `OAuthAccountNotLinked`. Мы включили `allowDangerousEmailAccountLinking` и нормализуем email в lowercase и у Credentials, и в GitHub `profile`. В проде так нельзя без своей верификации почты.

**Что нового / вокруг OAuth 2.1.** PKCE обязателен для публичных клиентов; GitHub App vs OAuth App (нам OAuth App). Auth.js v5 подхватывает `AUTH_GITHUB_ID/SECRET` сам.

**На собесе.** «OAuth code flow, callback только на сервере. Linking по email — осознанный риск MVP, в комментарии в коде. GitHub-only пользователь без `passwordHash` не входит формой — тот же `authorize` возвращает null.»

---

### bcrypt (bcryptjs)

**Что это и зачем.** Хеш паролей с **солью** и cost (у нас **12**). В БД не plaintext. Проверка: `compare(plain, hash)`, не `===`.

**Почему не SHA-256 / argon2 / bcrypt натив.** SHA без соли и растяжения — для паролей нельзя (радужные таблицы, слишком быстро). Argon2id сейчас «правильнее» (память против GPU) — хороший ответ «что бы взял в проде». bcryptjs — чистый JS, без native addon, проще с pnpm. Лимит bcrypt: **72 байта**; в Zod `max(72)`.

**Timing.** Если bcrypt вызывать только когда пользователь найден, по времени ответа видно, есть ли email. В `authorize` всегда `compare` с dummy-хешем того же cost, если хеша нет.

**На собесе.** «Пароли только bcrypt cost 12, на сервере. В сессию хеш не попадает. Dummy-compare против enumeration. Знаю про Argon2 как следующий шаг.»

---

### Zod 4

**Что это и зачем.** Runtime-схемы + вывод типов: `z.infer<typeof credentialsSchema>`. TypeScript **стирается** в JS: без Zod API примет любой JSON. Один контракт на `authorize`, register и login.

**Почему не Yup / Valibot / class-validator / «только TS».** Yup — старый DX. Valibot — легче бандл, меньше экосистемы. class-validator — декораторы, больше бэкенд-стиль. «Только TS» не защищает POST. Zod — де-факто фронт+Next.

**Что нового (3 → 4).** `z.email()` вместо deprecated `z.string().email()`. Другой пайп: сначала `trim`/`toLowerCase`, потом `.pipe(z.email())` — иначе пробелы в начале валят формат. Zod 4 — отдельная major, API минифицирован.

**Связка с Prisma.** Prisma — compile-time типы из схемы БД. Zod — runtime вход с клиента. Оба нужны: «строка из формы» ≠ «ряд в User».

**На собесе.** «Zod 4 на границе: форма и Credentials. Email нормализую до unique. Prisma типы — для запросов, Zod — чтобы мусор не дошёл до БД. Это не дублирование, разные слои.»

---

## Мини-таблица «спросили — одно предложение»

| Тема | Фраза |
| --- | --- |
| RSC | По умолчанию сервер, клиент — остров под клики |
| Compiler | Сам мемоизирует, `useMemo` не по привычке |
| proxy vs middleware | Next 16, Node; matcher узкий |
| JWT vs session | JWT из-за Credentials; revoke слабее |
| Prisma 7 | Adapter `pg`, клиент в `src/generated` |
| Neon | Direct URL, не pooler для migrate |
| FSD | Lite, слои с кодом, не пустые папки |
| pnpm | Строгий store, allowBuilds для Prisma |
| OAuth | Code flow, точный redirect URI |
| Zod vs TS | TS на сборке, Zod в рантайме |

---

## Чего не было в шагах 1–3 (если спросят)

shadcn, RHF, TanStack Query, Zustand — **М2**. Тесты — **М3**. Docker — **М4**. Rate limit / Sentry — **М5**. SessionProvider не ставили: сессия через `auth()` в RSC. Better Auth не берём.

Дальше по плану месяца: REST API (CRUD + Zod + `requireUser()`).
