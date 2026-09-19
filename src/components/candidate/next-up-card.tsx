import Link from "next/link";
import { ArrowRight, CalendarClock, Hourglass, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { NextAction } from "@/lib/next-action";

const KIND_ICON = {
  revise: Wrench,
  submit: CalendarClock,
  awaiting: Hourglass,
  pending: Hourglass,
  caught_up: Sparkles,
} as const;

/** The dashboard's most important component: what to do next, and the button to do it. */
export function NextUpCard({ action }: { action: NextAction }) {
  const Icon = KIND_ICON[action.kind];
  const urgent = action.kind === "revise" || action.kind === "submit";
  const overdue = action.detail.startsWith("Overdue");

  return (
    <section
      aria-labelledby="next-up-title"
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white",
        urgent ? "border-brand-200" : "border-line"
      )}
    >
      {urgent && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand-600" />
      )}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
              urgent
                ? "border-brand-200 bg-brand-50 text-brand-600"
                : "border-line bg-ink-50 text-ink-500"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
              {action.eyebrow}
            </p>
            <h2 id="next-up-title" className="mt-1 text-base font-semibold text-ink-900">
              {action.title}
            </h2>
            {action.trial ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <span className="truncate font-medium text-ink-800">
                  {action.trial.title}
                </span>
                <span className="text-ink-500">
                  {action.trial.companyName ?? "Startup"}
                </span>
                <StatusBadge
                  size="sm"
                  tone={overdue ? "danger" : action.tone}
                  label={action.detail}
                />
                <span className="tabular font-medium text-emerald-700">
                  {formatCurrency(action.trial.paymentAmount, action.trial.currency)}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-ink-500">{action.detail}</p>
            )}
          </div>
        </div>
        <Link href={action.href} className="shrink-0">
          <Button variant={urgent || action.kind === "caught_up" ? "default" : "outline"}>
            {action.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>
    </section>
  );
}
