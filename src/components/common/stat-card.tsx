import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A key metric: label, value, and one line of context. `tone` colours the
 * value only when the number itself means something (money earned, work that
 * needs attention); the card stays neutral either way.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
  footer,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "attention";
  /** Makes the whole card a link to where the number comes from. */
  href?: string;
  /** Optional trend or status line under the context. */
  footer?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-md border",
              tone === "positive"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : tone === "attention"
                  ? "border-accent-200 bg-accent-50 text-accent-700"
                  : "border-ink-200 bg-ink-50 text-ink-500"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
        <p className="text-xs font-medium text-ink-500">{label}</p>
      </div>
      <p
        className={cn(
          "tabular mt-3 text-2xl font-semibold tracking-tight",
          tone === "positive" ? "text-emerald-700" : "text-ink-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      {footer && <div className="mt-3 border-t border-line pt-2.5">{footer}</div>}
    </>
  );

  const className =
    "block rounded-xl border border-line bg-surface p-4 transition-colors";
  return href ? (
    <Link
      href={href}
      className={cn(className, "hover:border-ink-300 focus-visible:border-brand-400")}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export { StatCard as MetricCard };
