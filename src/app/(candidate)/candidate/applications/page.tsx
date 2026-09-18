import Link from "next/link";
import { Building, CheckCircle2 } from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import { getCandidateApplications, getCandidateProfileId } from "@/lib/data/candidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { MarkNotificationsRead } from "@/components/notifications/mark-notifications-read";
import { getNotificationSummary } from "@/lib/data/notifications";
import { EmptyState } from "@/components/common/empty-state";
import { DEFAULT_CURRENCY, WITHDRAWABLE_APPLICATION_STATUSES } from "@/lib/constants";
import { WithdrawApplicationButton } from "@/components/candidate/withdraw-application-button";
import type { ApplicationStatus } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: ApplicationStatus }) {
  switch (status) {
    case "selected":
      return (
        <Badge variant="success" className="font-semibold">
          Selected for Project
        </Badge>
      );
    case "shortlisted":
      return (
        <Badge variant="default" className="bg-brand-600 text-white">
          Shortlisted
        </Badge>
      );
    case "reviewing":
      return <Badge variant="warning">Under Review</Badge>;
    case "rejected":
      return <Badge variant="destructive">Not Selected</Badge>;
    case "withdrawn":
      return <Badge variant="outline">Withdrawn</Badge>;
    default:
      return <Badge variant="secondary">Application Submitted</Badge>;
  }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <MarkNotificationsRead scopes={[{ linkPrefix: "/candidate/applications" }]} />
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900">My Applications</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track the evaluation status of all your submitted paid trial project
          applications.
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
        <div className="space-y-3">
          {applications.map((application) => (
            <div
              key={application.id}
              className={cn(
                "rounded-xl border bg-white p-5 shadow-sm transition-colors space-y-3",
                application.project && changed.has(application.project.id)
                  ? "border-brand-300 ring-2 ring-brand-100"
                  : "border-line hover:border-brand-600"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-ink-900">
                    {application.project?.title || "Evaluation Project"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building className="h-3.5 w-3.5" />
                      {application.project?.companyName || "Startup"}
                    </span>
                    <span>•</span>
                    <span>Applied {formatDate(application.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {application.project && changed.has(application.project.id) && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                      Updated
                    </span>
                  )}
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency(
                      application.project?.paymentAmount ?? 0,
                      application.project?.currency ?? DEFAULT_CURRENCY
                    )}
                  </span>
                  <StatusBadge status={application.status} />
                </div>
              </div>

              {application.coverMessage && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2">
                  <span className="font-semibold text-slate-700">Your proposal: </span>
                  {application.coverMessage}
                </div>
              )}

              {(
                WITHDRAWABLE_APPLICATION_STATUSES as readonly ApplicationStatus[]
              ).includes(application.status) && (
                <div className="flex justify-end">
                  <WithdrawApplicationButton applicationId={application.id} />
                </div>
              )}

              {application.status === "selected" && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Congratulations! You were selected by the startup for this trial
                    project.
                  </span>
                  <Link href={`/candidate/trials/${application.project?.id ?? ""}`}>
                    <Button size="sm" className="h-8 rounded-full text-xs">
                      Go to Project Workspace
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
