import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ApplicationStageBadge } from "@/components/candidate/application-stage-badge";
import { CompanyMark } from "@/components/common/company-mark";
import { applicationHref, stageOf, STAGE_DISPLAY } from "@/lib/applications";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { ApplicationSummaryView } from "@/lib/types/domain";

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_7rem_6rem_9rem_1rem]";
const COLUMNS_WITH_NEXT = "md:grid-cols-[minmax(0,1fr)_7rem_6rem_9rem_10rem_1rem]";

/**
 * Applications as a list/table hybrid: a real column header on wide screens,
 * stacked rows on narrow ones. Each row links to where the application goes next.
 */
export function ApplicationList({
  applications,
  showNextAction = false,
  highlight,
}: {
  applications: ApplicationSummaryView[];
  /** Adds the "what to do next" column (My Applications). */
  showNextAction?: boolean;
  /** Application ids that changed since the candidate last looked. */
  highlight?: Set<string>;
}) {
  const columns = showNextAction ? COLUMNS_WITH_NEXT : COLUMNS;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div
        aria-hidden
        className={cn(
          "hidden gap-4 border-b border-line bg-ink-50 px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-500 md:grid md:items-center",
          columns
        )}
      >
        <span>Project</span>
        <span>Applied</span>
        <span className="text-right">Value</span>
        <span>Status</span>
        {showNextAction && <span>Next step</span>}
        <span />
      </div>
      <ul className="divide-y divide-line">
        {applications.map((application) => {
          const stage = stageOf(application);
          const href = applicationHref(application);
          const company = application.project?.companyName ?? "Startup";
          const changed = highlight?.has(application.id) ?? false;
          const row = (
            <div
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:gap-4",
                columns
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <CompanyMark name={company} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                    <span className="truncate">
                      {application.project?.title ?? "Project"}
                    </span>
                    {changed && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500">
                        <span className="sr-only">Updated</span>
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {company}
                    <span className="md:hidden">
                      {" "}
                      · Applied {formatDate(application.createdAt)}
                    </span>
                  </p>
                </div>
              </div>
              <span className="hidden text-sm text-ink-600 md:block">
                {formatDate(application.createdAt)}
              </span>
              <span className="tabular hidden text-right text-sm font-medium text-ink-800 md:block">
                {application.project
                  ? formatCurrency(
                      application.project.paymentAmount,
                      application.project.currency || DEFAULT_CURRENCY
                    )
                  : "—"}
              </span>
              <span>
                <ApplicationStageBadge stage={stage} size="sm" />
              </span>
              {showNextAction && (
                <span className="hidden text-sm font-medium text-brand-700 md:block">
                  {href ? STAGE_DISPLAY[stage].action : "—"}
                </span>
              )}
              <ChevronRight
                aria-hidden
                className={cn(
                  "hidden h-4 w-4 md:block",
                  href ? "text-ink-300 group-hover:text-ink-600" : "invisible"
                )}
              />
            </div>
          );
          return (
            <li key={application.id} className={cn(changed && "bg-accent-50/40")}>
              {href ? (
                <Link
                  href={href}
                  className="group block transition-colors hover:bg-ink-50 focus-visible:bg-ink-50"
                >
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
