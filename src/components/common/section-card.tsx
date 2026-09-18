import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** The one card shell for app screens: icon, title, optional count and action. */
export function SectionCard({
  id,
  title,
  icon: Icon,
  count,
  action,
  className,
  children,
}: {
  /** Anchor target, e.g. for /candidate/profile#skills. */
  id?: string;
  title: string;
  icon?: LucideIcon;
  count?: number;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-32 rounded-2xl border border-line bg-white p-fib6 shadow-xs",
        className
      )}
    >
      <header className="flex items-center justify-between gap-fib5 border-b border-line pb-fib5">
        <div className="flex min-w-0 items-center gap-fib4">
          {Icon && <Icon className="h-5 w-5 shrink-0 text-brand-600" />}
          <h2 className="truncate text-lg font-bold text-ink-900">{title}</h2>
          {count !== undefined && (
            <span className="rounded-full bg-ink-100 px-fib4 py-fib1 text-xs font-semibold text-ink-500">
              {count}
            </span>
          )}
        </div>
        {action}
      </header>
      <div className="pt-fib6">{children}</div>
    </section>
  );
}
