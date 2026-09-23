import * as Sentry from "@sentry/nextjs";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { RouteError } from "@/app/_ui/route-error";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

test("dashboard scope offers retry and a way back to boards", async () => {
  const retry = vi.fn();
  const user = userEvent.setup();
  const { getByRole } = render(
    <RouteError error={new Error("db down")} retry={retry} scope="dashboard" />,
  );

  expect(getByRole("alert").textContent).toContain(
    "We could not load this view",
  );
  expect(getByRole("alert").textContent).not.toContain("db down");
  expect(getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe(
    "/dashboard",
  );

  await user.click(getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(Sentry.captureException).toHaveBeenCalledOnce();
});

test("production digest stays visible without the error message", () => {
  const { getByRole, getByText } = render(
    <RouteError
      error={{ message: "secret internals", digest: "abc123" }}
      retry={vi.fn()}
      scope="global"
    />,
  );

  expect(getByRole("heading", { name: "Something went wrong" })).toBeTruthy();
  expect(getByText("Reference abc123")).toBeTruthy();
  expect(getByRole("alert").textContent).not.toContain("secret internals");
});
