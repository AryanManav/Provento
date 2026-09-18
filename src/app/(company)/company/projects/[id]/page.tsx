import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import {
  getCompanyIdForUser,
  getProjectApplicants,
  getProjectHeader,
} from "@/lib/data/company";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/common/status-banner";
import { EmptyState } from "@/components/common/empty-state";
import { ApplicationStatusForm } from "@/components/company/application-status-form";
import { MarkNotificationsRead } from "@/components/notifications/mark-notifications-read";
import { CountBadge } from "@/components/notifications/count-badge";
import { getNotificationSummary } from "@/lib/data/notifications";
import { cn } from "@/lib/utils";
import { CLOSED_APPLICATION_STATUSES } from "@/lib/constants";
import type { ApplicantView } from "@/lib/types/domain";
import type { ApplicationStatus } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

export default async function ManageProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { id } = await params;
  const { updated, error } = await searchParams;

  const project = await getProjectHeader(id);
  if (!project) notFound();

  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== project.companyId) notFound();
  }

  const [applicants, notifications] = await Promise.all([
    getProjectApplicants(project.id),
    getNotificationSummary(user.id),
  ]);

  const projectPath = `/company/projects/${project.id}`;
  const reviewPath = `${projectPath}/review`;
  const applicantPath = (applicationId: string) =>
    `${projectPath}/applicants/${applicationId}`;
  const unreadLinks = new Set(notifications.unread.map((marker) => marker.linkUrl));
  const reviewUpdates = notifications.unread.filter(
    (marker) => marker.linkUrl === reviewPath
  ).length;

  const isClosed = (application: ApplicantView) =>
    (CLOSED_APPLICATION_STATUSES as readonly ApplicationStatus[]).includes(
      application.status
    );
  // Rejected and withdrawn applications leave the main list but stay on record.
  const activeApplicants = applicants.filter((application) => !isClosed(application));
  const closedApplicants = applicants.filter(isClosed);
  const placesTaken = applicants.filter(
    (application) => application.status !== "withdrawn"
  ).length;

  const renderApplicant = (application: ApplicantView) => (
    <article
      key={application.id}
      className={cn(
        "space-y-fib5 rounded-2xl border bg-white p-fib6 shadow-xs",
        unreadLinks.has(applicantPath(application.id))
          ? "border-brand-300 ring-2 ring-brand-100"
          : "border-line"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-fib4">
        <div className="min-w-0">
          <div className="flex items-center gap-fib4">
            <h2 className="font-semibold text-ink-900">{application.candidateName}</h2>
            {application.status === "submitted" && (
              <span className="rounded-full bg-brand-600 px-fib4 py-fib1 text-xs font-semibold text-white">
                New
              </span>
            )}
          </div>
          <p className="text-sm text-ink-500">
            {application.candidateHeadline || application.candidateEmail}
          </p>
        </div>
        <span className="rounded-full bg-ink-100 px-fib5 py-fib2 text-xs font-semibold capitalize text-ink-700">
          {application.status.replaceAll("_", " ")}
        </span>
      </div>

      <p className="line-clamp-4 whitespace-pre-wrap text-sm text-ink-700">
        {application.coverMessage}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-fib4 border-t border-line pt-fib5">
        <Link
          href={applicantPath(application.id)}
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          View full profile →
        </Link>
        <ApplicationStatusForm
          applicationId={application.id}
          status={application.status}
        />
      </div>
    </article>
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Applicants are on screen now; review-page items stay unread until opened. */}
      <MarkNotificationsRead
        scopes={[{ linkPrefix: `${projectPath}/applicants/` }, { link: projectPath }]}
      />
      <Link href="/company/projects" className="text-sm text-indigo-600">
        ← Projects
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review submitted applications and keep candidates informed.
            {project.maxApplicants !== null && (
              <span className="ml-fib3 font-semibold text-ink-700">
                {placesTaken} / {project.maxApplicants} places taken
              </span>
            )}
          </p>
        </div>
        <Link href={reviewPath}>
          <Button variant="outline" size="sm" className="gap-fib3">
            Evaluate delivered work
            <CountBadge count={reviewUpdates} />
          </Button>
        </Link>
      </div>

      {reviewUpdates > 0 && (
        <Link
          href={reviewPath}
          className="flex items-center justify-between gap-fib4 rounded-xl border border-brand-200 bg-brand-50 px-fib6 py-fib5 text-sm transition-colors hover:bg-brand-100"
        >
          <span className="font-semibold text-brand-800">
            {reviewUpdates} new on the evaluation page — submitted work or a question from
            your candidate.
          </span>
          <span className="shrink-0 font-semibold text-brand-700">Open →</span>
        </Link>
      )}

      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {updated && (
        <StatusBanner tone="success">
          {updated === "selected"
            ? "Candidate selected. They can now see the brief and submit their work."
            : `Application marked as ${updated.replaceAll("_", " ")}.`}
        </StatusBanner>
      )}

      {applicants.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Candidates who apply will appear here. You'll see their full profile before deciding."
        />
      ) : (
        <div className="space-y-fib6">
          {activeApplicants.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-fib6 text-center text-sm text-ink-500">
              No applications waiting on you.
            </p>
          ) : (
            <div className="space-y-fib5">
              {activeApplicants.map((application) => renderApplicant(application))}
            </div>
          )}

          {closedApplicants.length > 0 && (
            <details className="group rounded-2xl border border-line bg-white">
              <summary className="cursor-pointer list-none px-fib6 py-fib5 text-sm font-semibold text-ink-600 hover:text-ink-900">
                Rejected &amp; withdrawn · {closedApplicants.length}
                <span className="ml-fib3 font-normal text-ink-400 group-open:hidden">
                  Show
                </span>
              </summary>
              <div className="space-y-fib5 border-t border-line p-fib5">
                {closedApplicants.map((application) => renderApplicant(application))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
