import { afterEach, expect, test, vi } from "vitest";
import { getSiteUrl } from "@/shared/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("getSiteUrl falls back to localhost when env is missing or blank", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
  expect(getSiteUrl().origin).toBe("http://localhost:3000");

  vi.stubEnv("NEXT_PUBLIC_APP_URL", "   ");
  expect(getSiteUrl().origin).toBe("http://localhost:3000");
});

test("getSiteUrl keeps origin and drops path", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://nexus.example/dashboard");
  expect(getSiteUrl().origin).toBe("https://nexus.example");
  expect(getSiteUrl().pathname).toBe("/");
});

test("getSiteUrl rejects a non-absolute value", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");
  expect(() => getSiteUrl()).toThrow(
    'NEXT_PUBLIC_APP_URL must be an absolute URL (got "not-a-url")',
  );
});
