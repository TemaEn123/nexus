import { registerUser, uniqueE2eEmail } from "./helpers/auth";
import { axeViolationDigest, expect, test } from "./helpers/axe";
import { addCard, columnByTitle, createBoard } from "./helpers/board";

test("home has no WCAG A/AA violations", async ({ page, makeAxeBuilder }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nexus" })).toBeVisible();

  const results = await makeAxeBuilder().analyze();
  expect(axeViolationDigest(results.violations)).toEqual([]);
});

test("login has no WCAG A/AA violations", async ({ page, makeAxeBuilder }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  const results = await makeAxeBuilder().analyze();
  expect(axeViolationDigest(results.violations)).toEqual([]);
});

test("dashboard has no WCAG A/AA violations", async ({
  page,
  makeAxeBuilder,
}) => {
  await registerUser(page, uniqueE2eEmail());
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("No boards yet")).toBeVisible();

  const results = await makeAxeBuilder().analyze();
  expect(axeViolationDigest(results.violations)).toEqual([]);
});

test("board has no WCAG A/AA violations after dnd-kit settles", async ({
  page,
  makeAxeBuilder,
}) => {
  await registerUser(page, uniqueE2eEmail());
  await createBoard(page, "Sprint");
  await addCard(page, "To Do", "Write e2e");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Sprint" })).toBeVisible();
  await expect(page.locator("title")).toHaveText(/Sprint/);

  const todo = columnByTitle(page, "To Do");
  const handle = page.getByRole("button", { name: "Move card Write e2e" });
  await expect(handle).toHaveAttribute("aria-roledescription", "draggable");
  await expect(todo.locator("li[role=button]")).toHaveCount(0);

  const results = await makeAxeBuilder().analyze();
  expect(axeViolationDigest(results.violations)).toEqual([]);
});
