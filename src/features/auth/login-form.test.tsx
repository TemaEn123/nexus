import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { login, loginWithGithub } from "@/features/auth/actions";
import { authFormError } from "@/features/auth/form-error";
import { LoginForm } from "@/features/auth/login-form";

vi.mock("@/features/auth/actions", () => ({
  login: vi.fn(),
  loginWithGithub: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

test("LoginForm shows the credentials banner from searchParam mapping", () => {
  const { getByRole, queryByText } = render(
    <LoginForm error={authFormError("credentials")} />,
  );

  expect(getByRole("alert").textContent).toBe("Invalid email or password.");
  expect(queryByText("Something went wrong. Try again.")).toBeNull();
});

test("LoginForm shows the invalid banner from searchParam mapping", () => {
  const { getByRole } = render(<LoginForm error={authFormError("invalid")} />);

  expect(getByRole("alert").textContent).toBe(
    "Check email and password (at least 8 characters).",
  );
});

test("LoginForm submits email and password to the login action", async () => {
  const user = userEvent.setup();
  const { getByLabelText, getByRole } = render(<LoginForm />);

  await user.type(getByLabelText("Email"), "user@example.com");
  await user.type(getByLabelText("Password"), "password1");
  await user.click(getByRole("button", { name: "Log in" }));

  const formData = vi.mocked(login).mock.calls[0]?.[0];
  expect(formData).toBeInstanceOf(FormData);
  expect(formData?.get("email")).toBe("user@example.com");
  expect(formData?.get("password")).toBe("password1");
  expect(loginWithGithub).not.toHaveBeenCalled();
});

test("LoginForm GitHub button calls only loginWithGithub", async () => {
  const user = userEvent.setup();
  const { getByLabelText, getByRole } = render(<LoginForm />);

  await user.type(getByLabelText("Email"), "user@example.com");
  await user.click(getByRole("button", { name: "Continue with GitHub" }));

  expect(loginWithGithub).toHaveBeenCalledOnce();
  expect(login).not.toHaveBeenCalled();
});
