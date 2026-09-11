import { expect, type Locator, type Page, test } from "@playwright/test";
import { registerUser, uniqueE2eEmail } from "./helpers/auth";
import {
  addCard,
  columnByTitle,
  createBoard,
  dndLiveRegion,
} from "./helpers/board";

/** Между стрелками ждём preview в колонке: иначе 24 ArrowRight улетают в Done, пока live region ещё «To Do». */
async function arrowUntilInColumn(
  page: Page,
  column: Locator,
  columnTitle: string,
) {
  const card = column.getByRole("button", { name: "Move card Write e2e" });
  const live = dndLiveRegion(page);

  for (let step = 0; step < 16; step += 1) {
    if ((await card.count()) > 0) {
      await expect(live).toContainText(`over ${columnTitle}`);
      return;
    }

    await page.keyboard.press("ArrowRight");
    try {
      await card.waitFor({ state: "visible", timeout: 800 });
    } catch {
      // всё ещё To Do — ещё стрелка
    }
  }

  await expect(card).toBeVisible();
  await expect(live).toContainText(`over ${columnTitle}`);
}

test("Tab to handle, Escape cancels, arrows drop into empty In Progress", async ({
  page,
}) => {
  await registerUser(page, uniqueE2eEmail());
  await createBoard(page, "Sprint");
  await addCard(page, "To Do", "Write e2e");

  const todo = columnByTitle(page, "To Do");
  const progress = columnByTitle(page, "In Progress");
  const handle = page.getByRole("button", { name: "Move card Write e2e" });
  const live = dndLiveRegion(page);

  await expect(handle).toHaveAttribute("aria-roledescription", "draggable");
  await expect(todo.locator("li[role=button]")).toHaveCount(0);

  await todo.getByRole("button", { name: "Delete column To Do" }).focus();
  await page.keyboard.press("Tab");
  await expect(handle).toBeFocused();

  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  // dragover (debounce 500ms) сразу сменяет «Picked up» на «over To Do».
  await expect(live).toHaveText(/Picked up Write e2e|Write e2e over To Do/);

  await page.keyboard.press("Escape");
  await expect(live).toHaveText("Cancelled");
  await expect(handle).toHaveAttribute("aria-pressed", "false");
  await expect(
    todo.getByRole("button", { name: "Move card Write e2e" }),
  ).toBeVisible();
  await expect(progress.getByText("No cards")).toBeVisible();

  await expect(handle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await expect(live).toHaveText(/Picked up Write e2e|Write e2e over To Do/);
  await arrowUntilInColumn(page, progress, "In Progress");

  const persist = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/cards/") &&
      response.ok(),
  );
  await page.keyboard.press("Space");
  await persist;
  await expect(live).toHaveText("Dropped Write e2e in In Progress");

  await expect(
    progress.getByRole("button", { name: "Move card Write e2e" }),
  ).toBeVisible();
  await expect(todo.getByText("No cards")).toBeVisible();

  await page.reload();

  await expect(
    columnByTitle(page, "In Progress").getByRole("button", {
      name: "Move card Write e2e",
    }),
  ).toBeVisible();
  await expect(
    columnByTitle(page, "To Do").getByText("No cards"),
  ).toBeVisible();
});
