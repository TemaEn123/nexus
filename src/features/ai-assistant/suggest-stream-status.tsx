const pulseClass = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";

const LINE_WIDTHS = ["w-4/5", "w-3/4", "w-3/5"] as const;

/** Typing: «Suggesting…» слышно, полоски — нет. */
export function SuggestingLabel({
  className = "text-xs text-zinc-500",
}: {
  className?: string;
}) {
  return (
    <p aria-live="polite" className={className}>
      Suggesting…
    </p>
  );
}

export function SuggestSubtasksSkeleton() {
  return (
    <ul aria-hidden="true" className="mt-2 flex flex-col gap-1.5">
      {LINE_WIDTHS.map((width) => (
        <li className={`h-3 ${width} ${pulseClass}`} key={width} />
      ))}
    </ul>
  );
}

export function SuggestReasonSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={`mt-0.5 h-4 w-64 max-w-full ${pulseClass}`}
    />
  );
}

export function SuggestEmpty({
  className = "text-xs text-zinc-500",
}: {
  className?: string;
}) {
  return <p className={className}>No suggestions</p>;
}

export function SuggestRetry({
  className,
  onRetry,
}: {
  className: string;
  onRetry: () => void;
}) {
  return (
    <button className={className} onClick={onRetry} type="button">
      Retry
    </button>
  );
}
