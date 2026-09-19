import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterChip {
  id: string;
  label: string;
  href: string;
  count?: number;
}

/**
 * A row of link chips for narrowing a list (status, topic). Lighter than tabs,
 * so it can sit under a tabbed header without competing with it.
 */
export function FilterChips({
  chips,
  active,
  label,
  className,
}: {
  chips: FilterChip[];
  active: string | null;
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1",
        className
      )}
    >
      {chips.map((chip) => {
        const current = chip.id === active;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md border px-2.5 py-1 text-sm transition-colors",
              current
                ? "border-ink-900 bg-ink-900 font-medium text-white"
                : "border-line bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900"
            )}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className="tabular ml-1.5 opacity-70">{chip.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
