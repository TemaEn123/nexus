import type { Metadata } from "next";
import { GlitchtipSmokeButton } from "./_ui/glitchtip-smoke-button";

export const metadata: Metadata = {
  title: "GlitchTip smoke",
  robots: { index: false, follow: false },
};

/**
 * Временный маршрут М5.1 шаг 6. Не в нав. После проверки стека `src/...` — удалить.
 * `?side=server` — RSC throw. Кнопка — браузер.
 */
export default async function GlitchtipSmokePage({
  searchParams,
}: PageProps<"/glitchtip-smoke">) {
  const params = await searchParams;

  if (params.side === "server") {
    throw new Error("glitchtip-smoke-prod-server");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">GlitchTip smoke</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Temporary. Remove after production stack traces look like src/.
      </p>
      <GlitchtipSmokeButton />
    </main>
  );
}
