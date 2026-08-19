import type { Metadata } from "next";
import Link from "next/link";
import { authFormError } from "@/features/auth/form-error";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const params = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Create account
      </h1>
      <RegisterForm error={authFormError(params.error)} />
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          className="font-medium text-zinc-950 underline dark:text-zinc-50"
          href="/login"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
