"use client";

import { useFormStatus } from "react-dom";

/** Кнопка внутри формы delete: confirm, затем submit. `pending` — только эта строка. */
export function DeleteBoardButton({ className }: { className: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!confirm("Delete this board?")) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
