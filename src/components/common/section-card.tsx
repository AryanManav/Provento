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
  description,
  className,
  children,
}: {
  /** One line under the title: what this section is, or where it comes from. */
  description?: ReactNode;
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
      className={cn("scroll-mt-20 rounded-xl border border-line bg-white p-5", className)}
    >
      <header className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />}
          <h2 className="truncate text-base font-semibold text-ink-900">{title}</h2>
          {count !== undefined && (
            <span className="tabular rounded bg-ink-100 px-1.5 text-2xs font-medium text-ink-500">
              {count}
            </span>
          )}
        </div>
        {action}
      </header>
      {description && <p className="pt-2 text-xs text-ink-500">{description}</p>}
      <div className="pt-4">{children}</div>
    </section>
  );
}
