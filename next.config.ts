import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Компилятор мемоизирует сам. useMemo / useCallback — только с комментарием, зачем:
  // 1) значение в deps useEffect, чтобы эффект не стрелял от новой ссылки;
  // 2) чужой API сравнивает по === (плагины, подписки);
  // 3) профайлер: без обёртки ломается. Иначе — лишнее.
  // "use no memo" — только если компилятор ломает конкретный файл.
  reactCompiler: true,
  // Slim Docker (М4.2): `.next/standalone` + `node server.js`.
  // Хост и Vercel — без `output`, обычный `next start`.
  output: process.env.DOCKER === "1" ? "standalone" : undefined,
};

const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Иначе CLI льёт карты на sentry.io.
  sentryUrl: process.env.SENTRY_URL ?? "https://app.glitchtip.com",
  telemetry: false,
  silent: !process.env.CI,
  // Без токена (CI, Docker, локальный build) не генерим/не удаляем .map вхолостую.
  sourcemaps: {
    disable: !uploadSourceMaps,
    deleteSourcemapsAfterUpload: true,
    assets: [".next/server", ".next/static"],
  },
  release: {
    finalize: false,
  },
  suppressOnRouterTransitionStartWarning: true,
});
