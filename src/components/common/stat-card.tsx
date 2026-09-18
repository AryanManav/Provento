import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive";
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-fib6 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-fib4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          {label}
        </p>
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50">
            <Icon className="h-4 w-4 text-ink-500" />
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-fib5 text-2xl font-bold",
          tone === "positive" ? "text-emerald-600" : "text-ink-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-fib2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
