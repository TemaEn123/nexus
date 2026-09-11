import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { register } from "@/features/auth/actions";
import { authFormError } from "@/features/auth/form-error";
import { RegisterForm } from "@/features/auth/register-form";

vi.mock("@/features/auth/actions", () => ({
  login: vi.fn(),
  loginWithGithub: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

test("RegisterForm shows the exists banner from searchParam mapping", () => {
  const { getByRole } = render(
    <RegisterForm error={authFormError("exists")} />,
  );

  expect(getByRole("alert").textContent).toBe(
    "An account with this email already exists.",
  );
});

test("RegisterForm submits email and password to the register action", async () => {
  const user = userEvent.setup();
  const { getByLabelText, getByRole } = render(<RegisterForm />);

  await user.type(getByLabelText("Email"), "user@example.com");
  await user.type(getByLabelText("Password"), "password1");
  await user.click(getByRole("button", { name: "Create account" }));

  const formData = vi.mocked(register).mock.calls[0]?.[0];
  expect(formData).toBeInstanceOf(FormData);
  expect(formData?.get("email")).toBe("user@example.com");
  expect(formData?.get("password")).toBe("password1");
});

test("RegisterForm has no GitHub action", () => {
  const { queryByRole } = render(<RegisterForm />);

  expect(queryByRole("button", { name: "Continue with GitHub" })).toBeNull();
});
