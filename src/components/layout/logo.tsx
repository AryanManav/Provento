import { cn } from "@/lib/utils";

/**
 * The Trialent mark: a "T" with a teal point beside it — the delivered result.
 * The wordmark sits beside it; `markOnly` for tight spaces.
 */
export function Logo({
  markOnly = false,
  inverted = false,
  className,
}: {
  markOnly?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 shrink-0" fill="none">
        <rect width="24" height="24" rx="6" className="fill-brand-600" />
        <path d="M7 8h10M12 8v9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="17.5" cy="16.5" r="1.6" className="fill-emerald-300" />
      </svg>
      {!markOnly && (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight",
            inverted ? "text-white" : "text-ink-900"
          )}
        >
          Trialent
        </span>
      )}
    </span>
  );
}
