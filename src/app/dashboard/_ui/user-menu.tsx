import { logout } from "@/features/auth/actions";
import { requireUser } from "@/server/require-user";

/**
 * Имя и Sign out в chrome dashboard.
 * Async RSC: `auth()` читает cookie — только внутри Suspense в layout,
 * иначе сегмент блокирует `loading.tsx`.
 */
export async function UserMenu() {
  const user = await requireUser();
  const displayName = user.name ?? user.email ?? "Account";

  return (
    <div className="flex items-center gap-3">
      <p className="max-w-48 truncate text-sm text-zinc-600 dark:text-zinc-400">
        {displayName}
      </p>
      <form action={logout}>
        <button
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
