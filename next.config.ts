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

export default nextConfig;
