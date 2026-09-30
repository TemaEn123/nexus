import type { Metadata } from "next";
import Link from "next/link";
import { consumeVerificationToken } from "@/features/auth/verification";

export const metadata: Metadata = {
  title: "Confirm email",
};

const linkClass = "font-medium text-zinc-950 underline dark:text-zinc-50";

function firstParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Ссылка из письма. Публичная: proxy не уводит залогиненного на dashboard.
 * Повторный заход после успеха — invalid, токен уже удалён.
 */
export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const email = firstParam(params.email)?.toLowerCase();
  const token = firstParam(params.token);
  const result =
    email && token ? await consumeVerificationToken(email, token) : "invalid";

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {result === "ok" ? "Email confirmed" : "Link not valid"}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {result === "ok"
          ? "You can keep using Nexus. GitHub can now be connected to this account."
          : result === "expired"
            ? "This confirmation link has expired."
            : "This confirmation link is invalid or already used."}
      </p>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        <Link className={linkClass} href="/login">
          Log in
        </Link>
        {" · "}
        <Link className={linkClass} href="/dashboard">
          Dashboard
        </Link>
      </p>
    </>
  );
}
