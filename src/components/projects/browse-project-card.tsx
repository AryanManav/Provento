import Link from "next/link";
import { ArrowRight, CalendarClock, Clock } from "lucide-react";
import { CompanyMark } from "@/components/common/company-mark";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { purposeLabel, spotsLeft } from "@/lib/projects";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BrowseProjectView } from "@/lib/types/domain";
import { RoleBadge } from "@/components/profile/role-badge";

const AVAILABILITY: Record<
  BrowseProjectView["availability"],
  { label: string; tone: StatusTone }
> = {
  open: { label: "Open", tone: "success" },
  full: { label: "Full", tone: "warning" },
  selected: { label: "In progress", tone: "active" },
  closed: { label: "Closed", tone: "neutral" },
};

const STACK_SHOWN = 4;

/** One project in Browse: who, what it pays, how long, the stack, and whether it's open. */
export function BrowseProjectCard({ project }: { project: BrowseProjectView }) {
  const status = AVAILABILITY[project.availability];
  const places = spotsLeft(project.maxApplicants, project.applicationCount);
  const open = project.availability === "open";
  const extra = project.stack.length - STACK_SHOWN;

  return (
    <article className="group relative flex flex-col rounded-xl border border-line bg-white p-5 transition-[border-color,box-shadow] hover:border-ink-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <CompanyMark name={project.companyName || "Startup"} className="h-8 w-8" />
          <span className="truncate text-sm text-ink-600">
            {project.companyName || "Startup"}
          </span>
          <RoleBadge role="company" size="sm" />
        </div>
        <StatusBadge size="sm" tone={status.tone} label={status.label} />
      </div>

      <h3 className="mt-4 text-base font-semibold leading-snug text-ink-900">
        {/* Stretched over the card, so the whole card opens the brief. */}
        <Link
          href={`/projects/${project.slug}`}
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none group-hover:text-brand-700"
        >
          {project.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{project.description}</p>

      {project.stack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {project.stack.slice(0, STACK_SHOWN).map((skill) => (
            <li
              key={skill}
              className="rounded border border-line bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-600"
            >
              {skill}
            </li>
          ))}
          {extra > 0 && (
            <li className="px-1 py-0.5 text-[11px] text-ink-400">+{extra}</li>
          )}
        </ul>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
        <div>
          <dt className="text-2xs text-ink-500">Fee</dt>
          <dd className="tabular text-sm font-semibold text-emerald-700">
            {formatCurrency(project.paymentAmount, project.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-2xs text-ink-500">Effort</dt>
          <dd className="flex items-center gap-1 text-sm font-medium text-ink-800">
            <Clock className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            {project.expectedHours}h
          </dd>
        </div>
        <div>
          <dt className="text-2xs text-ink-500">Apply by</dt>
          <dd className="flex items-center gap-1 text-sm font-medium text-ink-800">
            <CalendarClock className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            {formatDate(project.applicationDeadline).replace(/ \d{4}$/, "")}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-ink-500">
        <span>
          {purposeLabel(project)}
          {places !== null && open && ` · ${places} place${places === 1 ? "" : "s"} left`}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
          {open ? "View & apply" : "View project"}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </article>
  );
}
