import type { Metadata } from "next";
import Link from "next/link";
import { authFormError } from "@/features/auth/form-error";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
};

/**
 * Кастомная страница входа (`pages.signIn: "/login"` в auth.ts).
 * `searchParams` в App Router — Promise; `error` ставит Server Action через redirect.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Log in</h1>
      <LoginForm error={authFormError(params.error)} />
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          className="font-medium text-zinc-950 underline dark:text-zinc-50"
          href="/register"
        >
          Register
        </Link>
      </p>
    </>
  );
}
