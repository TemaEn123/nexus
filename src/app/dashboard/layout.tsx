import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserMenuSkeleton } from "./_ui/dashboard-skeletons";
import { UserMenu } from "./_ui/user-menu";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shell dashboard: header не ждёт сессию.
 * `auth()` / cookies только в `UserMenu` внутри Suspense — иначе
 * этот layout блокирует `loading.tsx` сегмента.
 */
export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
          <Link
            className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
            href="/"
          >
            Nexus
          </Link>
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      {children}
    </div>
  );
}
