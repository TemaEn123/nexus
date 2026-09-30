# М5.5 — Auth hardening: подтверждение email

Имена из плана → код: задача 5 «подтверждение email (Resend/Nodemailer + `VerificationToken`); после verify выключить `allowDangerousEmailAccountLinking`». Пока почта не подтверждена, GitHub не склеивается с Credentials-аккаунтом. Groq и rate limit — другие пункты М5.

## Шаг 1 — граница

Цель: пользователь с паролем доказывает владение почтой. Только после `emailVerified` GitHub может привязаться к этому User. Флаг `allowDangerousEmailAccountLinking` выключаем.

Сейчас: `register` создаёт User без `emailVerified` и сразу вызывает `signIn`. У GitHub флаг включён. Таблица `VerificationToken` и колонка `User.emailVerified` уже есть в миграции `20260815115615_authjs`. Новая миграция не нужна.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Письмо | нет | Nodemailer + SMTP. Resend — те же переменные, отдельный SDK не берём |
| Development без SMTP | нет | ссылка в лог, регистрация не падает |
| Production без SMTP | нет | падает вызов отправки, не старт процесса |
| `VerificationToken` | нет | писать при register, удалять после verify |
| `emailVerified` | нет | выставлять на странице подтверждения |
| Опасная склейка | нет | убрать `allowDangerousEmailAccountLinking: true` |
| Доступ в dashboard | нет | не закрываем, пока письмо не подтверждено |
| Auth.js Email provider | нет | не делаем magic-link вход |
| Groq / rate limit | нет | пункты 5.6 и 5.8 |

Не делать: блокировать dashboard до verify; второй способ входа по ссылке из письма; хранить SMTP-пароль в клиенте.

Порядок: граница → mailer → токен при register → страница verify → выключить флаг → UI и текст `OAuthAccountNotLinked` → тесты → README.

Проверка шага 1: этот файл.

## Шаг 2 — mailer

Сделано: `src/server/mail.ts`.

- `sendVerificationEmail({ to, url })`
- SMTP включается, только если заданы `SMTP_HOST` и `EMAIL_FROM`
- порт по умолчанию 587, `465` включает `secure`
- `SMTP_USER` / `SMTP_PASSWORD` необязательны для самого транспорта
- без SMTP в development: `logger.info("verification_email", { to, verifyUrl })`
- без SMTP в production: throw в момент отправки. Исключение — Playwright с `NEXT_PUBLIC_E2E=1`: ссылка в лог, иначе CI `next start` роняет register
- env-схема их не требует, поэтому текущий `next start` без почты не падает

`.env.example`: пустые `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`. Для Resend хост `smtp.resend.com`, пользователь `resend`.

Тест: `src/server/mail.test.ts`.

## Шаг 3 — токен при `register`

Сделано: `src/features/auth/verification.ts`, вызов из `register` после создания User и до `signIn`.

- случайный токен, срок 24 часа
- `identifier` — email
- перед записью удаляются старые токены этого email
- письмо уходит через `sendVerificationEmail`
- ссылка: `{origin}/verify-email?email=...&token=...`
- страницы `/verify-email` ещё нет

Тест: `src/features/auth/verification.test.ts`.

## Шаг 4 — страница подтверждения

Сделано: `GET /verify-email?email=&token=` в `src/app/(auth)/verify-email/page.tsx`.

- токен и email совпали и срок не вышел → `User.emailVerified`, токен удалён, текст «Email confirmed»
- срок вышел → токен удалён, «This confirmation link has expired»
- нет строки, пустые параметры или пользователь уже удалён (`P2025`) → «invalid or already used», не 500
- повторный заход после успеха снова invalid: токен одноразовый
- страница публичная, proxy на неё не смотрит

## Шаг 5 — выключить опасную склейку

Сделано: у GitHub в `src/server/auth.ts` больше нет `allowDangerousEmailAccountLinking`.

- почта не подтверждена → GitHub с тем же email не привязывается, Auth.js отвечает `OAuthAccountNotLinked`
- после `/verify-email` поле `emailVerified` стоит, и Auth.js склеивает аккаунты сам
- вход только через GitHub по-прежнему создаёт нового User
- lowercase email в `profile` оставлен, чтобы адреса сходились

Не делали: README.

## Шаг 6 — текст и повторная отправка

Сделано.

- Register: «We'll email you a confirmation link…». После успеха человек всё равно входит в dashboard
- Login: `OAuthAccountNotLinked` просит войти паролем, подтвердить почту и только потом подключить GitHub
- Dashboard, если `emailVerified` пустой: «Check your email…» и кнопка Send again. Доски не блокируются
- `resendVerification` шлёт ссылку на email текущей сессии и заменяет старый токен. Чужой адрес передать нельзя
- `?verify=sent` меняет текст на «We sent a new confirmation link»

## Шаг 7 — README

Сделано: README описывает подтверждение почты, запрет склейки до `emailVerified` и SMTP-переменные. Локально без SMTP ссылка в логе сервера. Ссылка на этот отчёт.

## Итог

M5.5 закрыт. Аккаунт с паролем и GitHub склеиваются только после перехода по ссылке из письма. `allowDangerousEmailAccountLinking` выключен. До подтверждения dashboard открыт.

Не делали: блокировку dashboard, magic-link вход, Groq, rate limit.

Дальше: М5.6 — Groq вместо Vercel AI Gateway.
