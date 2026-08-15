# М1.3 — Auth.js v5

Сделано:

- `next-auth@5.0.0-beta.32` (стабильной пятёрки на npm нет) + `@auth/prisma-adapter`, Zod, bcryptjs (cost 12)
- User: `passwordHash`, `emailVerified`, `image`; модели Account / Session / VerificationToken
- Credentials + GitHub; сессия JWT (Credentials не умеет database). `session.user.id` из `token.sub`
- Страницы `/login`, `/register`, `/dashboard`; actions в `src/features/auth/`
- `src/proxy.ts`: `/dashboard` без сессии → `/login`; залогиненный с `/login`|`/register` → `/dashboard`
- GitHub: lowercase email + `allowDangerousEmailAccountLinking` (MVP; в проде нужна своя верификация почты)

`AUTH_SECRET` / `AUTH_GITHUB_*` — в `.env.example`. Открывать `localhost`, не `127.0.0.1`.

Дальше: REST API (CRUD boards/columns/cards, Zod).
