import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Every workspace page opens with this: title, one line of purpose, actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col justify-between gap-4 sm:flex-row sm:items-end",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 text-xs font-medium text-ink-500">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
