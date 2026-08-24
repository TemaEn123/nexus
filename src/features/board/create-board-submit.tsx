"use client";

import { useFormStatus } from "react-dom";

/** Кнопка внутри формы: `useFormStatus` читает pending предка `<form>`. */
export function CreateBoardSubmit({ className }: { className: string }) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? "Creating…" : "Create board"}
    </button>
  );
}
