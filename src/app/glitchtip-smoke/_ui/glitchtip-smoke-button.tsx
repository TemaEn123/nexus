"use client";

const buttonClass =
  "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

/** М5.1 шаг 6: клиентский throw на live. Маршрут временный. */
export function GlitchtipSmokeButton() {
  return (
    <button
      className={buttonClass}
      onClick={() => {
        throw new Error("glitchtip-smoke-prod-browser");
      }}
      type="button"
    >
      Throw browser error
    </button>
  );
}
