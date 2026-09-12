import { chromium } from "@playwright/test";

/**
 * Lab CWV на живом `pnpm start`. Не Lighthouse CLI: registry из РФ виснет,
 * тот же Chrome, что e2e (`channel: chrome`). Throttle как Lighthouse mobile.
 *
 *   pnpm start --hostname 127.0.0.1
 *   pnpm perf:cwv
 *   pnpm perf:cwv http://127.0.0.1:3000/login
 *   pnpm perf:cwv --suite
 */

const BASE = "http://127.0.0.1:3000";
const suite = process.argv.includes("--suite");
const url = process.argv.find((arg) => arg.startsWith("http")) ?? `${BASE}/`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);

async function throttleOn() {
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

async function throttleOff() {
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
}

await page.addInitScript(() => {
  const state = { lcp: null, cls: 0, longTasks: [] };
  window.__cwv = state;

  new PerformanceObserver((list) => {
    const last = list.getEntries().at(-1);
    if (!last) {
      return;
    }
    const node = last.element;
    state.lcp = {
      startTime: last.startTime,
      tag: node?.tagName ?? null,
      text: node?.textContent?.trim().slice(0, 80) || last.url || null,
    };
  }).observe({ type: "largest-contentful-paint", buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        state.cls += entry.value;
      }
    }
  }).observe({ type: "layout-shift", buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      state.longTasks.push(entry.duration);
    }
  }).observe({ type: "longtask", buffered: true });
});

async function collectLoad() {
  return page.evaluate(() => {
    const state = window.__cwv;
    const paints = performance.getEntriesByType("paint");
    const nav = performance.getEntriesByType("navigation")[0];
    let blocking = 0;
    for (const duration of state.longTasks) {
      if (duration > 50) {
        blocking += duration - 50;
      }
    }
    return {
      lcpMs: state.lcp ? Math.round(state.lcp.startTime) : null,
      lcpTag: state.lcp?.tag ?? null,
      lcpText: state.lcp?.text ?? null,
      cls: Math.round(state.cls * 1000) / 1000,
      fcpMs: Math.round(
        paints.find((entry) => entry.name === "first-contentful-paint")
          ?.startTime ?? 0,
      ),
      ttfbMs: nav ? Math.round(nav.responseStart) : null,
      longTaskBlockingMs: Math.round(blocking),
    };
  });
}

async function collectInp(locator) {
  if (!locator || (await locator.count()) === 0) {
    return null;
  }

  await page.evaluate(() => {
    window.__cwvInp = null;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          window.__cwvInp == null ||
          entry.duration > window.__cwvInp.duration
        ) {
          window.__cwvInp = { name: entry.name, duration: entry.duration };
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });

  await locator.click({ noWaitAfter: true });
  await page.waitForTimeout(500);
  return page
    .evaluate(() => {
      const value = window.__cwvInp;
      return value
        ? { name: value.name, durationMs: Math.round(value.duration) }
        : null;
    })
    .catch(() => null);
}

async function measure(target, inpLocator) {
  await throttleOn();
  await page.goto(target, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2_000);
  const load = await collectLoad();
  const inp = await collectInp(inpLocator);
  return { url: target, formFactor: "mobile-slow4g", load, inp };
}

function columnByTitle(title) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}

async function runSuite() {
  const home = await measure(
    `${BASE}/`,
    page.getByRole("link", { name: "Log in" }),
  );

  const login = await measure(`${BASE}/login`, page.getByLabel("Email"));

  await throttleOff();
  const email = `cwv-${Date.now()}@example.com`;
  await page.goto(`${BASE}/register`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password1");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");

  const dashboard = await measure(
    `${BASE}/dashboard`,
    page.getByLabel("Title"),
  );

  await throttleOff();
  await page.getByLabel("Title").fill("Sprint");
  await page.getByRole("button", { name: "Create board" }).click();
  await page.waitForURL(/\/dashboard\/[^/]+$/);
  const todo = columnByTitle("To Do");
  await todo.getByLabel("New card").fill("Write e2e");
  await todo.getByRole("button", { name: "Add card" }).click();
  await page.getByRole("button", { name: "Move card Write e2e" }).waitFor();
  const boardUrl = page.url();

  const board = await measure(boardUrl, page.getByLabel("New card").first());

  return { screens: [home, login, dashboard, board] };
}

const report = suite
  ? await runSuite()
  : await measure(url, page.getByRole("link", { name: "Log in" }));

await browser.close();
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
