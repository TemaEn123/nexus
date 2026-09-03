"use client";

import { useFormStatus } from "react-dom";

/** Кнопка внутри формы: `pending` снаружи (Query) или `useFormStatus` у Server Action. */
export function PendingSubmit({
  className,
  idleLabel,
  pendingLabel,
  pending: pendingProp,
}: {
  className: string;
  idleLabel: string;
  pendingLabel: string;
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
