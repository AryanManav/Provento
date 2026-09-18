import Link from "next/link";
import { ArrowRight, Building, MessageSquareQuote } from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import { getCandidateApplications, getCandidateProfileId } from "@/lib/data/candidate";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { MarkNotificationsRead } from "@/components/notifications/mark-notifications-read";
import { getNotificationSummary } from "@/lib/data/notifications";
import { EmptyState } from "@/components/common/empty-state";
import { ApplicationStageBadge } from "@/components/candidate/application-stage-badge";
import { WithdrawApplicationButton } from "@/components/candidate/withdraw-application-button";
import {
  STAGE_DISPLAY,
  applicationHref,
  applicationStage,
  type ApplicationStage,
} from "@/lib/applications";
import {
  DEFAULT_CURRENCY,
  WITHDRAWABLE_APPLICATION_STATUSES,
  companyProfilePath,
} from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types/database.types";
import type { ApplicationSummaryView } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

/** Finished one way or another — listed below the ones still moving. */
const CLOSED_STAGES: ApplicationStage[] = [
  "completed",
  "cancelled",
  "not_selected",
  "withdrawn",
];

/** What the candidate should know or do next, for the stages that need a line. */
const STAGE_NOTE: Partial<Record<ApplicationStage, string>> = {
  building:
    "You were selected! Open the workspace for the brief, the submission form and the clarification thread.",
  awaiting_review:
    "Your work is with the startup. Their decision and message will appear in the workspace, and you'll get a notification.",
  revision_requested: "The startup asked for changes. Open the workspace to resubmit.",
  completed: "Evaluation complete. Your feedback and outcome are in the workspace.",
};

function ApplicationCard({
  application,
  changed,
}: {
  application: ApplicationSummaryView;
  changed: boolean;
}) {
  const stage = applicationStage(application.status, application.project?.status);
  const href = applicationHref(application);
  const note = STAGE_NOTE[stage];
  const canWithdraw = (
    WITHDRAWABLE_APPLICATION_STATUSES as readonly ApplicationStatus[]
  ).includes(application.status);
  const companyName = application.project?.companyName || "the startup";

  return (
    // The title link stretches over the whole card (after:inset-0), so the card
    // opens the project; the few controls inside sit above it (relative z-10).
    <article
      className={cn(
        "group relative space-y-fib5 rounded-2xl border bg-white p-fib6 shadow-xs transition-all",
        href && "hover:border-brand-300 hover:shadow-md",
        changed ? "border-brand-300 ring-2 ring-brand-100" : "border-line"
      )}
    >
      <div className="flex flex-col justify-between gap-fib4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-fib3">
            {href ? (
              <Link
                href={href}
                className="text-base font-bold text-ink-900 after:absolute after:inset-0 after:rounded-2xl hover:text-brand-600"
              >
                {application.project?.title ?? "Evaluation project"}
              </Link>
            ) : (
              <h3 className="text-base font-bold text-ink-900">
                {application.project?.title ?? "Evaluation project"}
              </h3>
            )}
            {changed && (
              <span className="rounded-full bg-rose-50 px-fib3 py-0.5 text-[11px] font-semibold text-rose-600">
                Updated
              </span>
            )}
          </div>
          <p className="mt-fib2 flex flex-wrap items-center gap-x-fib3 text-xs text-ink-500">
            {application.project ? (
              <Link
                href={companyProfilePath(application.project.companyId)}
                className="relative z-10 flex items-center gap-fib2 font-medium text-ink-700 hover:text-brand-600 hover:underline"
              >
                <Building className="h-3.5 w-3.5" />
                {application.project.companyName || "Startup"}
              </Link>
            ) : (
              <span className="flex items-center gap-fib2 font-medium text-ink-700">
                <Building className="h-3.5 w-3.5" />
                Startup
              </span>
            )}
            <span>·</span>
            <span>Applied {formatDate(application.createdAt)}</span>
            <span>·</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(
                application.project?.paymentAmount ?? 0,
                application.project?.currency ?? DEFAULT_CURRENCY
              )}
            </span>
          </p>
        </div>
        <ApplicationStageBadge stage={stage} />
      </div>

      {application.decisionNote && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-fib5 py-fib4">
          <p className="flex items-center gap-fib2 text-xs font-semibold text-brand-700">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Message from {companyName}
          </p>
          <p className="mt-fib2 whitespace-pre-wrap text-sm text-ink-800">
            {application.decisionNote}
          </p>
        </div>
      )}

      {note && (
        <p className="rounded-lg border border-line bg-surface-muted px-fib5 py-fib4 text-sm text-ink-700">
          {note}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-fib4 border-t border-line pt-fib5">
        {canWithdraw ? (
          <div className="relative z-10">
            <WithdrawApplicationButton applicationId={application.id} />
          </div>
        ) : (
          <span />
        )}
        {href && (
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex items-center gap-fib2 rounded-full px-fib6 py-fib3 text-sm font-semibold transition-colors",
              application.status === "selected"
                ? "bg-brand-600 text-white group-hover:bg-brand-700"
                : "bg-brand-50 text-brand-700"
            )}
          >
            {STAGE_DISPLAY[stage].action}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </article>
  );
}

export default async function CandidateApplicationsPage() {
  const user = await requireCandidate();
  const candidateId = await getCandidateProfileId(user.id);
  const [applications, notifications] = await Promise.all([
    candidateId ? getCandidateApplications(candidateId) : Promise.resolve([]),
    getNotificationSummary(user.id),
  ]);
  // Status changes since the last visit, by project.
  const changed = new Set(
    notifications.unread
      .filter((marker) => marker.type === "application_status")
      .map((marker) => marker.projectId)
  );

  const isClosed = (application: ApplicationSummaryView) =>
    CLOSED_STAGES.includes(
      applicationStage(application.status, application.project?.status)
    );
  const active = applications.filter((application) => !isClosed(application));
  const closed = applications.filter(isClosed);

  const renderList = (items: ApplicationSummaryView[]) => (
    <div className="space-y-fib4">
      {items.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          changed={!!application.project && changed.has(application.project.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-fib6 pb-fib8">
      <MarkNotificationsRead scopes={[{ linkPrefix: "/candidate/applications" }]} />
      <div className="border-b border-line pb-fib6">
        <h1 className="text-2xl font-bold text-ink-900">My Applications</h1>
        <p className="mt-fib2 text-sm text-ink-500">
          Every project you applied to. Open one to see its brief, or your workspace once
          you&apos;re selected.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications submitted yet"
          description="Browse available trial projects posted by startups and submit an application to prove your skills."
          actionText="Discover Open Projects"
          actionHref="/projects"
        />
      ) : (
        <>
          <section className="space-y-fib4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Active · {active.length}
            </h2>
            {active.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line p-fib6 text-center text-sm text-ink-500">
                Nothing in progress.{" "}
                <Link href="/projects" className="font-semibold text-brand-600">
                  Find a project to apply to →
                </Link>
              </p>
            ) : (
              renderList(active)
            )}
          </section>

          {closed.length > 0 && (
            <section className="space-y-fib4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Completed &amp; closed · {closed.length}
              </h2>
              {renderList(closed)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
