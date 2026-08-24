"use client";

import { useFormStatus } from "react-dom";

/** Кнопка внутри формы: `useFormStatus` читает pending предка `<form>`. */
export function PendingSubmit({
  className,
  idleLabel,
  pendingLabel,
}: {
  className: string;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
