import { boardFormError } from "@/features/board/form-error";

const errorClass =
  "shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200";

/**
 * `?error=` колонок и conflict. Карточки — инлайн, не `?error=card`.
 * searchParams здесь, не в page — канбан не ждёт query string.
 */
export async function BoardFormError({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/[boardId]">["searchParams"];
}) {
  const query = await searchParams;
  const errorCode = Array.isArray(query.error) ? query.error[0] : query.error;
  const formError =
    errorCode === "card" ? undefined : boardFormError(query.error);

  if (!formError) {
    return null;
  }

  return <p className={errorClass}>{formError}</p>;
}
