import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  // М4 CI: pnpm build && pnpm start. Локально — dev, reuseExistingServer.
  // Пустой ключ: E2E Suggest = 503, не живой Gateway. .env не перебивает уже заданный env.
  // NEXT_PUBLIC_E2E: без Query Devtools, иначе кнопка ворует Tab. Нужен сервер, который
  // поднял Playwright; reuseExistingServer со своим `pnpm dev` панель всё ещё покажет.
  webServer: {
    command:
      process.env.CI === "true"
        ? "pnpm start --hostname 127.0.0.1"
        : "pnpm dev --hostname 127.0.0.1",
    url: baseURL,
    reuseExistingServer: process.env.CI !== "true",
    timeout: 120_000,
    env: {
      ...process.env,
      AI_GATEWAY_API_KEY: "",
      NEXT_PUBLIC_E2E: "1",
    },
  },
});
