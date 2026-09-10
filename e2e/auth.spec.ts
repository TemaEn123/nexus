import { expect, test } from "@playwright/test";
import {
  E2E_PASSWORD,
  fillCredentials,
  registerUser,
  uniqueE2eEmail,
} from "./helpers/auth";

test("guest dashboard redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("wrong password stays on login with credentials copy", async ({
  page,
}) => {
  await page.goto("/login");
  await fillCredentials(page, uniqueE2eEmail(), E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("register signs in, sign out, then login returns to dashboard", async ({
  page,
}) => {
  const email = uniqueE2eEmail();

  await registerUser(page, email);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("No boards yet")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");

  await fillCredentials(page, email, E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});
