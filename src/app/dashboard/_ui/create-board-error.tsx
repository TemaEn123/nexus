import { boardFormError } from "@/features/board/form-error";

const errorClass =
  "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/**
 * `?error=` после redirect create. Ждёт searchParams здесь, не в page —
 * иначе форма Create блокируется на query string.
 */
export async function CreateBoardError({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const params = await searchParams;
  const message = boardFormError(params.error);

  if (!message) {
    return null;
  }

  return <p className={errorClass}>{message}</p>;
}
