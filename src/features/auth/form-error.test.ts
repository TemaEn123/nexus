import { expect, test } from "vitest";
import { authFormError } from "@/features/auth/form-error";

const GENERIC = "Something went wrong. Try again.";

test("authFormError skips empty searchParam values", () => {
  expect(authFormError(undefined)).toBeUndefined();
  expect(authFormError([])).toBeUndefined();
});

test("authFormError maps known codes and takes the first array item", () => {
  expect(authFormError("invalid")).toBe(
    "Check email and password (at least 8 characters).",
  );
  expect(authFormError(["credentials", "exists"])).toBe(
    "Invalid email or password.",
  );
  expect(authFormError("exists")).toBe(
    "An account with this email already exists.",
  );
  expect(authFormError("OAuthAccountNotLinked")).toBe(
    "This email is already used. Log in with email and password, then connect GitHub.",
  );
});

test("authFormError unknown codes stay generic", () => {
  expect(authFormError("CredentialsSignin")).toBe(GENERIC);
});
