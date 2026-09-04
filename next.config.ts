import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Компилятор мемоизирует сам. useMemo / useCallback — только с комментарием, зачем:
  // 1) значение в deps useEffect, чтобы эффект не стрелял от новой ссылки;
  // 2) чужой API сравнивает по === (плагины, подписки);
  // 3) профайлер: без обёртки ломается. Иначе — лишнее.
  // "use no memo" — только если компилятор ломает конкретный файл.
  reactCompiler: true,
};

export default nextConfig;
