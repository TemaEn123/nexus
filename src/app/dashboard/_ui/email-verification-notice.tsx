import { resendVerification } from "@/features/auth/actions";
import { requireUser } from "@/server/require-user";
import { prisma } from "@/shared/lib/db";

const buttonClass =
  "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";

function sentParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "sent";
}

/**
 * Пока `emailVerified` пустой. Не блокирует доски.
 * `requireUser` здесь, не в page: заголовок dashboard не ждёт сессию.
 */
export async function EmailVerificationNotice({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return null;
  }

  const params = await searchParams;
  const sent = sentParam(params.verify);

  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
      <p className="text-zinc-600 dark:text-zinc-400">
        {sent
          ? "We sent a new confirmation link. GitHub can be connected after you open it."
          : "Check your email to confirm this account. GitHub can be connected after that."}
      </p>
      <form action={resendVerification} className="mt-3">
        <button className={buttonClass} type="submit">
          Send again
        </button>
      </form>
    </div>
  );
}
