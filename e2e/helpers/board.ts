import type { Page } from "@playwright/test";

export function columnByTitle(page: Page, title: string) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}

export async function createBoard(page: Page, title: string) {
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create board" }).click();
  await page.waitForURL(/\/dashboard\/[^/]+$/);
}

export async function addCard(page: Page, columnTitle: string, title: string) {
  const column = columnByTitle(page, columnTitle);
  await column.getByLabel("New card").fill(title);
  await column.getByRole("button", { name: "Add card" }).click();
  await page.getByRole("button", { name: `Move card ${title}` }).waitFor();
}

/** Плагин Accessibility: не `alert` — Next route announcer тоже alert. */
export function dndLiveRegion(page: Page) {
  return page.locator("[id^='dnd-kit-announcement']");
}
