import { expect, test } from "vitest";
import { credentialsSchema } from "@/features/auth/schemas";

test("credentialsSchema trims and lowercases email before format check", () => {
  expect(
    credentialsSchema.safeParse({
      email: "  Foo@Bar.COM  ",
      password: "password1",
    }),
  ).toEqual({
    success: true,
    data: { email: "foo@bar.com", password: "password1" },
  });
  expect(
    credentialsSchema.safeParse({
      email: "not-an-email",
      password: "password1",
    }).success,
  ).toBe(false);
});

test("credentialsSchema keeps password between 8 and 72 characters", () => {
  expect(
    credentialsSchema.safeParse({
      email: "a@b.co",
      password: "1234567",
    }).success,
  ).toBe(false);
  expect(
    credentialsSchema.safeParse({
      email: "a@b.co",
      password: "a".repeat(8),
    }).success,
  ).toBe(true);
  expect(
    credentialsSchema.safeParse({
      email: "a@b.co",
      password: "a".repeat(73),
    }).success,
  ).toBe(false);
});
