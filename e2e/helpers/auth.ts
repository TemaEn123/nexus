import { type Page, test } from "@playwright/test";

export const E2E_PASSWORD = "password1";

export function uniqueE2eEmail() {
  return `e2e-${test.info().workerIndex}-${Date.now()}@example.com`;
}

export async function fillCredentials(
  page: Page,
  email: string,
  password = E2E_PASSWORD,
) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
}

export async function registerUser(
  page: Page,
  email: string,
  password = E2E_PASSWORD,
) {
  await page.goto("/register");
  await fillCredentials(page, email, password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");
}
