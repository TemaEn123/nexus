import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/features/auth/actions";
import { requireUser } from "@/server/require-user";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Protected dashboard (RSC). Канбан будет в М2 — здесь только сессия.
 * `requireUser()` гарантирует `user.id`; name/image есть у GitHub, у email/password
 * часто только email.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const displayName = user.name ?? user.email ?? "Account";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-16">
      <div>
        <p className="text-sm text-zinc-500">
          <Link
            className="hover:text-zinc-950 dark:hover:text-zinc-50"
            href="/"
          >
            Nexus
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Signed in as {displayName}
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-4 text-sm dark:border-zinc-800">
        {user.name ? (
          <div>
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
        ) : null}
        {user.email ? (
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        ) : null}
      </dl>

      <form action={logout}>
        <button
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
