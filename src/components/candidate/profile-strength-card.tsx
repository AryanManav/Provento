import type { ReactNode } from "react";

export function ProfileStrengthCard({
  value,
  action,
}: {
  value: number;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-fib6 shadow-xs">
      <div className="flex items-center justify-between gap-fib4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Profile strength
        </h2>
        <span className="text-sm font-bold text-brand-600">{value}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile strength"
        className="mt-fib5 h-2 w-full overflow-hidden rounded-full bg-ink-100"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>

      {value < 100 && (
        <p className="mt-fib4 text-xs text-ink-400">
          Add skills and a GitHub repository to increase your selection rate.
        </p>
      )}
      {action}
    </section>
  );
}
