import Link from "next/link";
import { ArrowRight, Banknote, Building, Clock } from "lucide-react";
import { purposeLabel, spotsLeft } from "@/lib/projects";
import { companyProfilePath } from "@/lib/constants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { BrowseProjectView } from "@/lib/types/domain";

const AVAILABILITY = {
  open: { label: "Applications open", tone: "bg-emerald-50 text-emerald-700" },
  full: { label: "Full", tone: "bg-amber-50 text-amber-700" },
  selected: { label: "Candidate selected", tone: "bg-ink-100 text-ink-600" },
  closed: { label: "Closed", tone: "bg-ink-100 text-ink-500" },
} as const;

/** One project in Browse: who, what it pays, how long, and whether it's open. */
export function BrowseProjectCard({ project }: { project: BrowseProjectView }) {
  const status = AVAILABILITY[project.availability];
  const places = spotsLeft(project.maxApplicants, project.applicationCount);
  const open = project.availability === "open";

  return (
    <article className="group relative flex flex-col gap-fib4 rounded-2xl border border-line bg-white p-fib6 shadow-xs transition-all hover:border-brand-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-fib3">
        <Link
          href={companyProfilePath(project.companyId)}
          className="relative z-10 inline-flex min-w-0 items-center gap-fib2 text-xs font-medium text-ink-500 hover:text-brand-600 hover:underline"
        >
          <Building className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{project.companyName || "Startup"}</span>
        </Link>
        <span
          className={cn(
            "shrink-0 rounded-full px-fib4 py-fib1 text-xs font-semibold",
            status.tone
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="space-y-fib2">
        {/* Stretched over the card, so the whole card opens the brief. */}
        <Link
          href={`/projects/${project.slug}`}
          className="text-lg font-bold leading-snug text-ink-900 after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand-700"
        >
          {project.title}
        </Link>
        <p className="line-clamp-2 text-sm text-ink-500">{project.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-fib5 gap-y-fib2 text-sm">
        <span className="inline-flex items-center gap-fib2 font-semibold text-emerald-700">
          <Banknote className="h-4 w-4" />
          {formatCurrency(project.paymentAmount, project.currency)}
        </span>
        <span className="inline-flex items-center gap-fib2 text-ink-600">
          <Clock className="h-4 w-4 text-ink-400" />
          {project.expectedHours}h
        </span>
        <span className="rounded-full bg-brand-50 px-fib4 py-fib1 text-xs font-semibold text-brand-700">
          {purposeLabel(project)}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-fib3 border-t border-line pt-fib4 text-xs text-ink-500">
        <span>
          Apply by {formatDate(project.applicationDeadline)}
          {places !== null &&
            ` · ${project.applicationCount}/${project.maxApplicants} places`}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-fib1 font-semibold",
            open ? "text-brand-600" : "text-ink-500"
          )}
        >
          {open ? "Apply" : "View brief"}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}
