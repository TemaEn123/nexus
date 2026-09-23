import { expect, test, vi } from "vitest";
import { parseEnv } from "@/server/env";

vi.mock("server-only", () => ({}));

const databaseUrl = "postgresql://nexus:nexus@127.0.0.1:5432/nexus";

test("parseEnv allows a missing AUTH_SECRET outside production", () => {
  expect(
    parseEnv({
      NODE_ENV: "development",
      DATABASE_URL: databaseUrl,
      AUTH_SECRET: "   ",
      AI_GATEWAY_API_KEY: "",
    }),
  ).toMatchObject({
    DATABASE_URL: databaseUrl,
    AUTH_SECRET: undefined,
    AI_GATEWAY_API_KEY: undefined,
  });
});

test("parseEnv requires AUTH_SECRET in production", () => {
  expect(() =>
    parseEnv({
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
    }),
  ).toThrow("AUTH_SECRET is required in production");
});

test("parseEnv still requires DATABASE_URL", () => {
  expect(() =>
    parseEnv({ NODE_ENV: "production", AUTH_SECRET: "secret" }),
  ).toThrow("DATABASE_URL is required");
});
