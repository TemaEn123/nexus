# М1.6 — SEO

Сделано:

- Константы: `src/shared/lib/site.ts` (`SITE_NAME`, `SITE_DESCRIPTION`, `getSiteUrl`). `NEXT_PUBLIC_APP_URL` в `.env` / `.env.example`
- Root `metadata`: `metadataBase`, `title.template` (`%s | Nexus`), OG, Twitter `summary_large_image`, `robots` index. Картинки — file convention, не дублировали URL
- Иконки `ImageResponse`: `icon.tsx` 32×32, `apple-icon.tsx` 180×180, марка `src/app/_ui/app-icon-mark.tsx`. Шаблонный `favicon.ico` убран
- `opengraph-image.tsx` 1200×630. Отдельный `twitter-image` не нужен
- `generateMetadata` на `/`: `await parent`, канонический `og:url`, картинки с родителя. Без `auth()` и fetch
- Title + `noindex` на `(auth)` и `dashboard` layouts; login/register/dashboard titles как в UI; 404 — title/description
- `robots.ts`: allow `/`, disallow `/dashboard`, `/api/`, `/login`, `/register`. Sitemap нет

Проверка: `pnpm typecheck` + `pnpm lint`. HTTP smoke (аноним, `localhost:3000`): `/` title Nexus, og/twitter/icon; `/login` `Log in | Nexus` + noindex; `/register` `Create account | Nexus` + noindex; `/this-does-not-exist` **404** `Not found | Nexus` + `noindex` (Next на not-found не пишет `nofollow`); `/dashboard` → **307** `/login`; `GET /api/boards` → **401 JSON**; `/icon` `/apple-icon` `/opengraph-image` → PNG; `/robots.txt` — disallow как выше. Вкладку с «N» и залогиненный dashboard metadata глазами в этом прогоне не сверяли. OG-дебаггеры — после деплоя (1.7).

Не делали: sitemap, JSON-LD, next-seo, маршрут доски / per-board OG, PWA manifest.

Дальше: Deploy на Vercel + Neon, `NEXT_PUBLIC_APP_URL` = production origin.
