"use client";

import { useFormStatus } from "react-dom";

/** Кнопка delete: confirm, затем submit. `pending` снаружи (Query) или `useFormStatus`. */
export function ConfirmSubmit({
  ariaLabel,
  className,
  confirmMessage,
  idleLabel,
  pendingLabel,
  pending: pendingProp,
}: {
  ariaLabel?: string;
  className: string;
  confirmMessage: string;
  idleLabel: string;
  pendingLabel: string;
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
