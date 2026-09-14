import { expect, test } from "@playwright/test";

test("home shows the public landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nexus" })).toBeVisible();
});
