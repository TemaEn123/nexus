import { expect, test } from "@playwright/test";
import { registerUser, uniqueE2eEmail } from "./helpers/auth";
import { addCard, columnByTitle, createBoard } from "./helpers/board";

test("register, board, card, drag, then Suggest 503", async ({ page }) => {
  await registerUser(page, uniqueE2eEmail());
  await createBoard(page, "Sprint");

  await expect(page.getByRole("heading", { name: "Sprint" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "In Progress" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Done" })).toBeVisible();

  const todo = columnByTitle(page, "To Do");
  const progress = columnByTitle(page, "In Progress");
  await expect(todo.getByText("No cards")).toBeVisible();

  await addCard(page, "To Do", "Write e2e");
  await expect(
    page.getByRole("button", { name: "Suggest subtasks for Write e2e" }),
  ).toBeVisible();

  const handle = page.getByRole("button", { name: "Move card Write e2e" });
  const persist = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/cards/") &&
      response.ok(),
  );
  await handle.dragTo(progress.locator("ul"), { steps: 12 });
  await persist;

  await expect(
    progress.getByRole("button", { name: "Move card Write e2e" }),
  ).toBeVisible();
  await expect(todo.getByText("No cards")).toBeVisible();

  await page.reload();

  const moved = columnByTitle(page, "In Progress").getByRole("button", {
    name: "Move card Write e2e",
  });
  await expect(moved).toBeVisible();
  await expect(
    columnByTitle(page, "To Do").getByText("No cards"),
  ).toBeVisible();

  const suggest = page.getByRole("button", {
    name: "Suggest subtasks for Write e2e",
  });
  const unavailable = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/suggest") &&
      response.status() === 503,
  );
  await suggest.click();
  await unavailable;

  await expect(
    page.getByText("AI is not configured. Add AI_GATEWAY_API_KEY."),
  ).toBeVisible();
  await expect(suggest).toBeVisible();
  await expect(moved).toBeVisible();
});
