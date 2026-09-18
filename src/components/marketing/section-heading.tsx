import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Every marketing section opens the same way: a pill label, a two-line heading
 * whose second half drops to grey, then an optional subhead. Hierarchy comes
 * from tonal value rather than a second font weight.
 */
export function SectionHeading({
  chip,
  title,
  trailing,
  subtitle,
  align = "center",
  className,
}: {
  chip?: string;
  title: ReactNode;
  /** Rendered in muted grey on its own line, continuing the sentence. */
  trailing?: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "space-y-fib5",
        centered && "text-center flex flex-col items-center",
        className
      )}
    >
      {chip && (
        <span className="inline-flex items-center rounded-full border border-line bg-white px-fib5 py-fib2 text-xs font-semibold text-ink-600 shadow-xs">
          {chip}
        </span>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 max-w-3xl text-balance">
        {title}
        {trailing && (
          <>
            {" "}
            <span className="text-ink-400">{trailing}</span>
          </>
        )}
      </h2>

      {subtitle && (
        <p className={cn("text-ink-500 max-w-xl", centered && "mx-auto")}>{subtitle}</p>
      )}
    </div>
  );
}
