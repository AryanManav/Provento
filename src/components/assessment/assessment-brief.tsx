import { CalendarClock, ClipboardList, Clock, Info } from "lucide-react";
import { BriefList } from "@/components/projects/brief";
import { ASSESSMENT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { HiringAssessmentView } from "@/lib/types/domain";

/** The technologies an assessment asks for, as mono chips. */
export function TechChips({ items, limit }: { items: string[]; limit?: number }) {
  if (items.length === 0) return null;
  const shown = limit ? items.slice(0, limit) : items;
  const extra = items.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
      {shown.map((item) => (
        <li
          key={item}
          className="rounded border border-line bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-600"
        >
          {item}
        </li>
      ))}
      {extra > 0 && <li className="px-1 py-0.5 text-[11px] text-ink-400">+{extra}</li>}
    </ul>
  );
}

/** "Frontend task · ~6 hours · Due 12 Oct 2026" */
export function AssessmentFacts({ assessment }: { assessment: HiringAssessmentView }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
      {assessment.type && <span>{ASSESSMENT_TYPES[assessment.type]}</span>}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-ink-400" aria-hidden />
        About {assessment.expectedHours} hour{assessment.expectedHours === 1 ? "" : "s"}
      </span>
      {assessment.deadline && (
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5 text-ink-400" aria-hidden />
          Due {formatDate(assessment.deadline)}
        </span>
      )}
    </p>
  );
}

/**
 * Said wherever a hiring assessment appears: it is how candidates are
 * evaluated, and it isn't paid work — that's what Build Only is for.
 */
export function UnpaidNote() {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 rounded-md border border-line bg-ink-50 px-3 py-2 text-xs sm:grid-cols-3">
      <div className="flex gap-1.5">
        <dt className="text-ink-500">Part of</dt>
        <dd className="font-medium text-ink-800">The hiring process</dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="text-ink-500">Payment</dt>
        <dd className="font-medium text-ink-800">Not applicable</dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="text-ink-500">Purpose</dt>
        <dd className="font-medium text-ink-800">Candidate evaluation</dd>
      </div>
    </dl>
  );
}

/** Everything a candidate needs to complete the assessment. */
export function AssessmentBrief({
  assessment,
  showTitle = true,
}: {
  assessment: HiringAssessmentView;
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-5">
      {showTitle && (
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-ink-900">{assessment.title}</h3>
          <AssessmentFacts assessment={assessment} />
        </div>
      )}
      <UnpaidNote />
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
        {assessment.description}
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Requirements
          </h4>
          <BriefList items={assessment.requirements} numbered />
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Deliverables
          </h4>
          <BriefList items={assessment.deliverables} />
        </div>
      </div>
      {assessment.technologies.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Technologies
          </h4>
          <TechChips items={assessment.technologies} />
        </div>
      )}
      {assessment.evaluationCriteria.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            How it&apos;s evaluated
          </h4>
          <BriefList items={assessment.evaluationCriteria} />
        </div>
      )}
    </div>
  );
}

/** The company's view of its own role's assessment: a line, expandable. */
export function AssessmentSummary({ assessment }: { assessment: HiringAssessmentView }) {
  return (
    <details className="group rounded-lg border border-line bg-surface">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          <span className="text-xs text-ink-500">Hiring assessment</span>
          <span className="truncate text-sm font-semibold text-ink-900">
            {assessment.title}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <AssessmentFacts assessment={assessment} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
            <Info className="h-3.5 w-3.5" aria-hidden />
            <span className="group-open:hidden">Show brief</span>
            <span className="hidden group-open:inline">Hide brief</span>
          </span>
        </span>
      </summary>
      <div className="border-t border-line px-4 py-4">
        <AssessmentBrief assessment={assessment} showTitle={false} />
      </div>
    </details>
  );
}
