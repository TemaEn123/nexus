# М6.4 — Portfolio polish

Имена из плана → код: задача 4 «Portfolio polish: custom domain (optional), OG image для шаринга». Домен не покупаем. Промпты, Groq, robots и иконки не меняем.

## Шаг 0 — граница

Цель: ссылку на Nexus можно кинуть в чат, и в превью видна доска. Адрес остаётся [https://nexus-pi-amber-56.vercel.app](https://nexus-pi-amber-56.vercel.app). Своего домена нет, пункт в плане необязательный.

Сейчас картинка уже есть с М1.6: `src/app/opengraph-image.tsx`, 1200×630, тёмный фон, две строки — `SITE_NAME` и `SITE_DESCRIPTION` («Kanban board»). Twitter берёт этот же файл при `summary_large_image`. `metadataBase` — `getSiteUrl()` из `NEXT_PUBLIC_APP_URL`. Главная в `generateMetadata` копирует картинки родителя. Витрина `/` показывает ту же строку «Kanban board».

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Домен | нет | не покупаем, DNS и GitHub OAuth не трогаем, `NEXT_PUBLIC_APP_URL` остаётся vercel.app |
| OG-картинка | файл есть | тот же `opengraph-image.tsx`: три колонки и короткая строка, что это канбан с подсказками. Размер 1200×630 |
| Текст витрины | уже есть | `SITE_DESCRIPTION` и абзац на `/` остаются «Kanban board». Строка про подсказки только на картинке |
| Twitter | уже есть | отдельный `twitter-image` не заводим |
| README | нет | одна фраза: превью есть, адрес — текущий Vercel |
| Код приложения | нет | robots, noindex, иконки, sitemap, JSON-LD, OG на каждую доску не делаем |

Не делать: покупать домен; менять `metadataBase`; заводить sitemap или JSON-LD; рисовать отдельную картинку на доску.

Порядок: граница → картинка → локальная проверка PNG и `og:image` → фраза в README.

Проверка шага 0: этот файл.

## Шаг 1 — картинка

Сделано. `src/app/opengraph-image.tsx` по-прежнему 1200×630. Сверху «Nexus» и строка «Kanban with suggestions». Ниже колонки To Do, In Progress, Done. `SITE_DESCRIPTION` и текст витрины не менялись. Отдельного `twitter-image` нет.

Проверка шага 1: `GET /opengraph-image` отдаёт PNG 1200×630. Абсолютный `og:image` на главной — шаг 2.

## Шаг 2 — проверка

Сделано. Код и `NEXT_PUBLIC_APP_URL` не менялись. На локальной главной:

- `og:image` — абсолютный `http://localhost:3000/opengraph-image?…`, тип `image/png`, 1200×630, alt Nexus
- `twitter:image` — тот же URL, карточка `summary_large_image`
- `og:description` и абзац витрины — «Kanban board»

Этот localhost берётся из локального `NEXT_PUBLIC_APP_URL`. На Vercel тот же `metadataBase` смотрит на уже заданный production URL. Домен, DNS и GitHub OAuth не трогали.

Проверка шага 2: мета-теги главной и PNG по ссылке из `og:image`. Фраза в README — шаг 3.

## Шаг 3 — README

Сделано. Сразу после live-ссылки одна фраза: превью показывает доску 1200×630 и ведёт на тот же адрес Vercel. Таблицу env и Deploy не переписывал.

Проверка шага 3: фраза в README. Задача М6.4 по границе закрыта.
