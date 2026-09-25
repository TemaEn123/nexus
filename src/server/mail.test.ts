import { expect, test, vi } from "vitest";
import type { ServerEnv } from "@/server/env";
import { mailConfig } from "@/server/mail";

vi.mock("server-only", () => ({}));

function env(overrides: Partial<ServerEnv>): ServerEnv {
  return {
    NODE_ENV: "development",
    DATABASE_URL: "postgresql://nexus:nexus@127.0.0.1:5432/nexus",
    ...overrides,
  };
}

test("mailConfig logs the link in development without SMTP", () => {
  expect(mailConfig(env({}))).toEqual({ mode: "log" });
});

test("mailConfig refuses to send in production without SMTP", () => {
  expect(() => mailConfig(env({ NODE_ENV: "production" }))).toThrow(
    "SMTP_HOST and EMAIL_FROM are required",
  );
});

test("mailConfig uses SMTP when host and from are set", () => {
  expect(
    mailConfig(
      env({
        SMTP_HOST: "smtp.resend.com",
        SMTP_PORT: "587",
        SMTP_USER: "resend",
        SMTP_PASSWORD: "re_test",
        EMAIL_FROM: "Nexus <noreply@example.com>",
      }),
    ),
  ).toEqual({
    mode: "smtp",
    host: "smtp.resend.com",
    port: 587,
    from: "Nexus <noreply@example.com>",
    user: "resend",
    password: "re_test",
  });
});
