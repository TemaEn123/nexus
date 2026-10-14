# М6.3 — README для портфолио

Имена из плана → код: задача 3 «README (must have): Demo GIF/screenshots, Architecture diagram, Tech decisions table, Setup local + Docker, Core Web Vitals screenshot, Test coverage summary». Код приложения, промпты и Groq не меняем.

## Шаг 0 — граница

Цель: незнакомый человек за минуту видит, что умеет Nexus и почему стек такой. Файл уже умеет запустить проект локально, в Docker и на Vercel.

Сейчас в `README.md`: live-ссылка, бейдж CI, таблица лабораторных CWV, требования, `.env`, Docker, скрипты, деплой, короткий текст про FSD-lite и Auth.js. Картинок в репозитории нет. Схемы Mermaid нет. Таблицы «зачем этот инструмент» нет. Сводки тестов нет.

Порядок секций сверху, после заголовка:

1. Что это и ссылка на live.
2. Демо: три снимка и GIF.
3. Схема.
4. Таблица решений.
5. Как запустить — текущие блоки требований, Docker, скриптов и Deploy остаются.
6. Core Web Vitals — текущая таблица плюс снимок прогона.
7. Тесты.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Снимки | нет | доска, Suggest на карточке, экран входа. Файлы в `docs/6/readme/` |
| GIF | нет | создать карточку и перетащить её. Секреты, почта и ключи в кадр не попадают |
| Схема | нет | один Mermaid: браузер, Next.js, Postgres, Auth.js, Groq. Папки FSD на схеме не рисуем |
| Решения | нет | таблица по одной фразе: Next.js App Router, Postgres + Prisma, Auth.js, TanStack Query, Route Handler для стрима, Groq, Biome, Playwright |
| Setup | уже есть | не переписываем Docker, скрипты и таблицу env |
| CWV | таблица есть | снимок того же lab-прогона `pnpm perf:cwv:suite`. Подпись: lab на `pnpm start`, не полевые данные Vercel |
| Тесты | нет | абзац: Vitest и Playwright (регистрация, доска, drag, Suggest без ключа → 503). Процент coverage не пишем: сбор покрытия в Vitest не настроен |
| Учебные отчёты | нет | в таблицу решений не ссылаемся |
| Код приложения | нет | не меняем |

Не делать: выдумывать процент coverage; переписывать Deploy; класть в кадр `.env` или ключ Groq; рисовать схему по папкам `src/`.

Порядок: граница → снимки и GIF → Mermaid → таблица решений → снимок CWV → абзац про тесты.

Проверка шага 0: этот файл.

## Шаг 1 — демо

Сделано. Файлы в `docs/6/readme/`:

- `board.png` — доска Product, колонки To Do / In Progress / Done
- `suggest.png` — у карточки «Write the launch note» список подзадач
- `login.png` — экран входа, поля пустые
- `drag.gif` — в To Do набирается и появляется «Check the links», «Review the copy» уезжает из In Progress в Done

Снимки с локального `127.0.0.1:3000` и локального Postgres. В кадре нет почты и ключей. В README секция «Демо» стоит сразу после live-ссылки.

Проверка шага 1: картинки открываются из README. Схема — шаг 2.

## Шаг 2 — схема

Сделано. В README секция «Схема» сразу после «Демо»: один `flowchart LR`. Узлы: Браузер, Next.js, Auth.js, Postgres, Groq. Рёбра: страницы/формы/стрим, JWT, Prisma, Suggest. Папок `src/` на схеме нет. Нижний абзац «Архитектура» (FSD-lite и proxy) не трогал.

Проверка шага 2: блок mermaid в README. Таблица решений — шаг 3.

## Шаг 3 — решения

Сделано. В README секция «Решения» сразу после «Схема». Восемь строк, по одной фразе: Next.js App Router, Postgres + Prisma, Auth.js, TanStack Query, Route Handler для стрима, Groq, Biome, Playwright. Ссылок на учебные отчёты нет.

Проверка шага 3: таблица в README. Снимок CWV — шаг 4.

## Шаг 4 — снимок CWV

Сделано. `docs/6/readme/cwv.png` — stdout повторного `pnpm perf:cwv:suite` на уже собранном `pnpm start` от 2026-09-14 (mobile slow-4G, сервер прогрет). В кадре почта заменена на `demo@example.com`.

Таблица в README не менялась: lab 2026-09-14, худший LCP **720 ms**, INP **16 ms**, CLS **0**. На прогретом повторе `/` дал LCP 596 ms, CLS 0, INP 16 ms. Подпись: это lab на `pnpm start`, не полевые данные Vercel.

Проверка шага 4: картинка под таблицей. Абзац про тесты — шаг 5.

## Шаг 5 — тесты

Сделано. В конце README секция «Тесты»: Vitest (`pnpm test:run`) и Playwright (`pnpm test:e2e`) — регистрация, доска, перенос карточки, Suggest без ключа → 503. Это путь из `e2e/critical-path.spec.ts`. Процент coverage не писали.

Проверка шага 5: абзац в README. Задача М6.3 по границе закрыта.
