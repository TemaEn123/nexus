# М6.2 — Streaming UX

Имена из плана → код: задача 2 «Streaming UX: typing indicator, abort, error states, empty states». Те же две кнопки М6.1 (`Suggest subtasks`, `Suggest priority`), Groq, `useObject`. Новых route нет. Чат / README GIF / смена модели — не этот шаг.

## Шаг 0 — граница

Цель: пока модель думает — видно, что идёт стрим; Stop не врёт об ошибке; после сбоя можно Retry; пустой ответ не выглядит как сломанный UI. Coverage / CWV / чат / таблица Subtask — не цель.

Сейчас (М6.1 + М2.9): `useObject` + «Suggesting…» + Stop. Ошибки инлайн (`suggestError` / `priorityError`): 401 / 404 / 503 / пустая доска. Stop глотает `AbortError` в SDK, но обрыв после HTTP 200 часто даёт общее «Something went wrong». Список subtasks появляется только когда в объекте уже есть пункты; пустая доска — Suggest priority disabled. Retry нет. `aria-live` на «Suggesting…» нет.

| Слой | Мок | Что делаем |
| --- | --- | --- |
| Typing | текст «Suggesting…» | скелет: 3 пульс-строки у subtasks; пульс у reason, пока нет текста |
| Abort | Stop есть | Stop: без `role="alert"`; частичный объект не ошибка; снять подсветку priority |
| Error | 401 / 404 / 503 / 400 | те же тексты + кнопка **Retry** (= повторный `suggest`) |
| Empty stream | список не рисуем | после финиша без пунктов: «No suggestions» + Retry |
| Empty board | disabled | не трогаем |
| a11y | Stop / `alert` | `aria-live="polite"` на «Suggesting…»; скелет `aria-hidden` |
| `useObject` | да | оставляем; не `useChat` |
| Route / Groq | да | не меняем URL, ключ, модель |
| Промпт / snapshot | М6.1 | не трогаем |
| Add subtask | как М2.9 | не трогаем |
| Чат | нет | не делаем |
| README GIF / Mermaid | нет | задача 3 М6 |
| Живая LLM в CI | нет | RTL на фикстуре: скелет, Stop без alert, Retry |
| `ci.yml` / Husky / Ruleset | нет | не меняем |

Не делать: textarea; смена Groq / схема Zod; e2e против модели; Add all; двигать карточку из priority; Redis; новый endpoint.

Почему не чат: две команды уже есть, контракт жёсткий. Почему не новый SDK-хук: `useObject` уже стримит объект; полируем состояния вокруг него.

Не ломаем: ключ только сервер, body пустой, 404 на чужой id, UI без ключа жив (503), Stop по-прежнему abort `fetch`.

Порядок: граница (этот шаг) → общий скелет + Retry → subtasks Stop/empty → priority Stop/подсветка → проверка на доске → README одна строка, если копирайт UX.

Проверка шага 0: этот файл. Кода нет.

## Шаг 1 — скелет и Retry

Сделано: `suggest-stream-status.tsx` — `SuggestingLabel` (`aria-live="polite"`), 3 пульс-строки subtasks, пульс reason, кнопка Retry. Subtasks: скелет пока нет пунктов. Priority: скелет пока нет `reason`. Ошибка + не loading → Retry (= тот же `suggest`). Stop / пустой финиш / подсветка — шаг 2–3.

Тесты: live region, `aria-hidden` на скелете, Retry у priority.

## Шаг 2 — Stop и empty у subtasks

Сделано: `suggestStreamView` — Stop глушит sdk/schema-ошибку (частичный список остаётся, `role="alert"` нет). Финиш без пунктов — не ошибка: «No suggestions» + Retry. Настоящие 401 / 404 / 503 как были. Priority Stop / подсветка — шаг 3.

Тесты: Stop без alert, empty copy без alert, Retry, `suggestStreamView` на фикстуре.

## Шаг 3 — Stop и подсветка у priority

Сделано: тот же `suggestStreamView` + `priorityStreamFields`. Stop глушит ложную ошибку, `clear()` и `pick`/`reason` не отдаём — кольцо на карточке снимается даже если SDK дописал чанк. Финиш без объекта — «No suggestions» + Retry. 401 / 404 / 503 / пустая доска как были (`priorityError`). Карточки не двигаем.

Тесты: Stop без alert, empty copy, `priorityStreamFields` сбрасывает pick.

## Шаг 4 — проверка на доске

Локально, `localhost:3000`, `GROQ_API_KEY` в `.env` есть. Пустая доска **Empty UX**: **Suggest priority** disabled. После карточки Login кнопка живая.

Streaming: **Suggesting…** (`aria-live="polite"`), у subtasks 3 пульс-строки. Stop сразу после старта: без `role="alert"`, без «Something went wrong»; у priority `pick`/`reason` и кольцо снялись. Повтор Suggest subtasks до финиша: 7 пунктов + Add, Login осталась в To Do.

Network: `POST /api/boards/:id/priority` и `POST /api/cards/:id/suggest` с `localhost:3000` (не api.openai.com). Retry / «No suggestions» на живой модели не ловили — модель ответила; это RTL шагов 2–3.

## Шаг 5 — README

Сделано: одна строка в сетапе — стрим Suggesting… / Stop, Retry после ошибки, пустой ответ No suggestions. GIF / Mermaid / CWV / чат не трогали (задача 3 М6).

М6.2 закрыт. Дальше по плану: М6 задача 3 — README (demo GIF, Mermaid, таблица решений).
