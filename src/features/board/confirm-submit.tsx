"use client";

import { useFormStatus } from "react-dom";

/** Кнопка внутри формы delete: confirm, затем submit. `pending` — только эта форма. */
export function ConfirmSubmit({
  className,
  confirmMessage,
  idleLabel,
  pendingLabel,
}: {
  className: string;
  confirmMessage: string;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
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
