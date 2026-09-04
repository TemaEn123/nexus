# М2.7 — React Compiler: когда ещё нужны `useMemo` / `useCallback`

Сделано:

- Компилятор уже был с М1.1: `reactCompiler: true` в `next.config.ts`, `babel-plugin-react-compiler` ровно `1.0.0`. Не `compilationMode: "annotation"`, без `"use memo"` / `"use no memo"`. React 19 — runtime из `react/compiler-runtime`, отдельный `react-compiler-runtime` не нужен
- Проверка, что это не флаг ради флага: в dev-чанке `KanbanBoard` (с `useOptimistic`) есть `compiler-runtime`, `c(...)` и `Symbol.for("react.memo_cache_sentinel")`. Скелетон `KanbanPending` мемоизируется явно
- Инвентаризация: в `src` нет `useMemo` / `useCallback` / `React.memo`. Обёртки с М1 не наслаивали — удалять нечего. Не добавляли «для вида»
- DnD-плагины: `useState(() => kanbanPlugins(...))` — один экземпляр на жизнь доски. dnd-kit сравнивает по ссылке; это не `useMemo`. Комментарий в `kanban-board.tsx`: компилятор чужой `===` не видит
- Список колонок вне drag — из Query/`useOptimistic`, локальный state только пока жест живой. Эффект-копию в `useState` не возвращали: компилятор мемоизирует рендер, не чинит `useEffect`. Иначе снова `Maximum update depth exceeded` (2.6)
- Обработчики (`onDrag*`, `onError={setError}`, инлайн `onClick` / `onClose`) и эффекты фокуса / `console.error` не оборачивали
- Правило на остаток проекта — комментарий в `next.config.ts`. `useMemo` / `useCallback` только с пометкой, зачем: (1) deps `useEffect`, чтобы не стрелял от новой ссылки; (2) чужой API по `===`; (3) профайлер, без обёртки ломается. Без комментария — лишнее. `"use no memo"` — только если компилятор ломает файл. ESLint ради compiler-lint не подключали: линтер — Biome

Проверка: `npm run typecheck` + `npm run lint` (`pnpm` в PATH сессии не было). Залогиненный UI в этом шаге не гоняли (нет браузера и dev-сервера в сессии). Имеет смысл глазами: после Add/Save/Delete нет цикла; drag / Escape / пустая колонка; create/delete колонки — как в 2.5–2.6.

Не делали: Zustand, RHF, shadcn, Query на список досок, column CUD через `useOptimistic`, drag колонок, gap-based, тесты, axe/Playwright, README про server vs UI state, второй линтер (`eslint-plugin-react-hooks`).

Дальше: М2.8 — Suspense + streaming (скелетоны колонок, anti-waterfall).
