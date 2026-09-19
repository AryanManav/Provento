import { cn } from "@/lib/utils";

/**
 * The Trialent wordmark: "trial" set in a bordered tag — the product's core
 * unit, a trial of real work — followed by "ent". Set in the app's own type
 * (Inter), so it themes with the page: the tag is a raised surface with a
 * hairline border in light and dark alike.
 *
 * `markOnly` shows the icon instead, for tight spaces and avatars.
 */
export function Logo({
  markOnly = false,
  inverted = false,
  className,
}: {
  markOnly?: boolean;
  /** On a dark band regardless of theme (e.g. a coloured panel). */
  inverted?: boolean;
  className?: string;
}) {
  if (markOnly) return <LogoMark className={cn("h-7 w-7", className)} />;

  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline text-[19px] font-semibold leading-none tracking-[-0.035em]",
        inverted ? "text-white" : "text-ink-900",
        className
      )}
    >
      <span
        className={cn(
          "mr-[2px] rounded-[6px] border py-[3px] pl-[4px] pr-[3px]",
          inverted
            ? "border-white/35 bg-white/10"
            : "border-line-strong bg-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] dark:bg-raised dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
        )}
      >
        trial
      </span>
      ent
    </span>
  );
}

/**
 * The icon: the tag with "tr" inside and a green status dot — the verified
 * result. Drawn as strokes, not text, so it looks identical everywhere (the
 * favicon and app icon — src/app/icon.svg and apple-icon.tsx — repeat it).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0", className)}
      fill="none"
    >
      <rect width="32" height="32" rx="8" className="fill-inverse" />
      <rect
        x="5.5"
        y="9.5"
        width="20"
        height="14"
        rx="4"
        strokeWidth="1.6"
        className="stroke-inverse-fg opacity-50"
      />
      <path
        d="M12 11.5V18.8Q12 21 14.2 21H14.8M9.8 14.2H14.6M18 14.2V21M18 16.8Q18 14.2 21 14.2"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-inverse-fg"
      />
      <circle
        cx="26"
        cy="9.5"
        r="3.2"
        strokeWidth="1.6"
        className="fill-money-500 stroke-inverse"
      />
    </svg>
  );
}
