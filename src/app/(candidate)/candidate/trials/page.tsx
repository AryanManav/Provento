import Link from "next/link";
import { requireCandidate } from "@/lib/auth/guards";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { getCandidateTrials } from "@/lib/data/trial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { CountBadge } from "@/components/notifications/count-badge";
import { getNotificationSummary } from "@/lib/data/notifications";
import { unreadByProject } from "@/lib/notifications";
import { isClosedWork } from "@/lib/applications";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CandidateTrialsPage() {
  const user = await requireCandidate();
  const candidateId = await getCandidateProfileId(user.id);
  const [allTrials, notifications] = await Promise.all([
    candidateId ? getCandidateTrials(candidateId) : Promise.resolve([]),
    getNotificationSummary(user.id),
  ]);
  const updates = unreadByProject(notifications.unread);
  // Finished trials move to My Applications ("Completed & closed").
  const trials = allTrials.filter((trial) => !isClosedWork(trial));
  const finishedCount = allTrials.length - trials.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900">Trial Projects</h1>
        <p className="text-xs text-slate-500 mt-1">
          Paid evaluation projects you were selected for. Submit your work here when it is
          ready for review.
        </p>
      </div>

      {trials.length === 0 ? (
        <EmptyState
          title={finishedCount > 0 ? "No active trial projects" : "No trial projects yet"}
          description={
            finishedCount > 0
              ? "Your finished projects, with their feedback, are under Completed & closed in My Applications."
              : "Once a startup selects you from your applications, the project appears here with its brief and a submission form."
          }
          actionText="View My Applications"
          actionHref="/candidate/applications"
        />
      ) : (
        <div className="space-y-3">
          {trials.map((trial) => {
            const updateCount = updates[trial.projectId] ?? 0;
            const latest = notifications.recent.find(
              (item) => item.projectId === trial.projectId && !item.read
            );
            return (
              <Link
                key={trial.projectId}
                href={`/candidate/trials/${trial.projectId}`}
                className={cn(
                  "relative block overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-colors",
                  updateCount > 0
                    ? "border-brand-300 ring-2 ring-brand-100"
                    : "border-line hover:border-brand-600"
                )}
              >
                {updateCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-brand-600"
                  />
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-fib3">
                      <h2 className="text-base font-bold text-ink-900">{trial.title}</h2>
                      <CountBadge count={updateCount} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {trial.companyName || "Startup"} · Due{" "}
                      {formatDate(trial.projectDeadline)} · {trial.expectedHours}h
                    </p>
                    {latest && (
                      <p className="mt-fib3 truncate text-sm text-ink-700">
                        <span className="font-semibold">{latest.title}</span>
                        <span className="text-ink-400">
                          {" "}
                          · {formatRelativeTime(latest.createdAt)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(trial.paymentAmount, trial.currency)}
                    </span>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {trial.workStatus.replaceAll("_", " ")}
                    </Badge>
                    <Button size="sm" variant="outline" className="rounded-full text-xs">
                      Open
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {trials.length > 0 && finishedCount > 0 && (
        <p className="text-center text-sm text-ink-500">
          {finishedCount} finished project{finishedCount === 1 ? "" : "s"} —{" "}
          <Link
            href="/candidate/applications"
            className="font-semibold text-brand-600 hover:underline"
          >
            see results in My Applications
          </Link>
        </p>
      )}
    </div>
  );
}
