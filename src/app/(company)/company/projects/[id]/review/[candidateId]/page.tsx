import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser } from "@/lib/data/company";
import { getEvaluation, getSelectedCandidates } from "@/lib/data/evaluation";
import { getProjectThread } from "@/lib/data/thread";
import { computeThreadEvidence, formatDuration } from "@/lib/evidence";
import { ProjectThread } from "@/components/common/project-thread";
import { AttachmentList } from "@/components/common/attachment-list";
import {
  ProjectFeedbackForm,
  ProjectOutcomeForm,
  ReviewSubmissionForm,
} from "@/components/company/evaluation-forms";
import { Badge } from "@/components/ui/badge";
import { MarkNotificationsRead } from "@/components/notifications/mark-notifications-read";
import { formatDate } from "@/lib/utils";
import { RoleBadge } from "@/components/profile/role-badge";

export const dynamic = "force-dynamic";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

/** One selected candidate's evaluation: their thread, submissions, feedback, outcome. */
export default async function CandidateEvaluationPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { id, candidateId } = await params;

  const [evaluation, selected] = await Promise.all([
    getEvaluation(id, candidateId),
    getSelectedCandidates(id),
  ]);
  if (!evaluation) notFound();

  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== evaluation.companyId) notFound();
  }

  const messages = await getProjectThread(id, candidateId, user.id);
  const reviewPath = `/company/projects/${id}/review/${candidateId}`;
  const evidence = computeThreadEvidence(messages);

  return (
    <div className="max-w-4xl space-y-5">
      {/* The old per-project address is cleared too (alerts from before). */}
      <MarkNotificationsRead
        scopes={[{ link: reviewPath }, { link: `/company/projects/${id}/review` }]}
      />
      <Link href={`/company/projects/${id}`} className="text-sm text-indigo-600">
        ← Applicants
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{evaluation.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate delivered work · Due {formatDate(evaluation.projectDeadline)}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {humanize(evaluation.workStatus)}
        </Badge>
      </div>

      {selected.length > 1 && (
        <nav
          aria-label="Selected candidates"
          className="flex flex-wrap gap-fib3 rounded-xl border border-line bg-white p-fib3"
        >
          {selected.map((item) => (
            <Link
              key={item.candidateId}
              href={`/company/projects/${id}/review/${item.candidateId}`}
              aria-current={item.candidateId === candidateId ? "page" : undefined}
              className={
                item.candidateId === candidateId
                  ? "rounded-lg bg-brand-600 px-fib5 py-fib3 text-sm font-semibold text-white"
                  : "rounded-lg px-fib5 py-fib3 text-sm font-semibold text-ink-600 hover:bg-ink-50"
              }
            >
              {item.name}
              <span className="ml-fib3 text-xs font-normal capitalize opacity-80">
                {humanize(item.workStatus)}
              </span>
            </Link>
          ))}
        </nav>
      )}

      <>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Candidate under evaluation
          </h2>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            {evaluation.candidate.name}
            <RoleBadge role="candidate" size="sm" />
          </p>
          <p className="text-sm text-slate-500">
            {evaluation.candidate.headline || evaluation.candidate.email}
          </p>
          <p className="mt-fib5 border-t border-line pt-fib5 text-sm text-ink-600">
            {evidence.companyQuestions === 0
              ? "No clarification messages from you yet, so there's no response time to record."
              : evidence.candidateMedianResponseMs === null
                ? `You've sent ${evidence.companyQuestions} message${evidence.companyQuestions === 1 ? "" : "s"}; the candidate hasn't replied yet.`
                : `Replied to ${evidence.candidateReplies} of your messages · median response ${formatDuration(evidence.candidateMedianResponseMs)}.`}
          </p>
        </section>

        <ProjectThread
          projectId={evaluation.projectId}
          candidateId={candidateId}
          messages={messages}
          viewer="company"
        />

        <section className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-lg font-semibold">
            Submitted work ({evaluation.submissions.length})
          </h2>

          {evaluation.submissions.length === 0 ? (
            <p className="text-sm text-slate-500">
              The candidate has not submitted anything yet.
            </p>
          ) : (
            evaluation.submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-lg border border-slate-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Submitted {formatDate(submission.submittedAt)}
                  </span>
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {humanize(submission.status)}
                  </Badge>
                </div>

                <a
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-indigo-600 hover:underline break-all"
                >
                  {submission.repositoryUrl}
                </a>

                {submission.deploymentUrl && (
                  <a
                    href={submission.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-indigo-600 hover:underline break-all"
                  >
                    {submission.deploymentUrl}
                  </a>
                )}

                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {submission.submissionNotes}
                </p>

                <AttachmentList attachments={submission.attachments} />

                {submission.status === "submitted" ||
                submission.status === "under_review" ? (
                  <ReviewSubmissionForm submissionId={submission.id} />
                ) : (
                  <div className="space-y-1 border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Decision recorded: {humanize(submission.status)} · final
                      {submission.reviewedAt && ` · ${formatDate(submission.reviewedAt)}`}
                    </p>
                    {submission.reviewNote && (
                      <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        <span className="font-semibold">Your message: </span>
                        {submission.reviewNote}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>

        <section className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Evaluation</h2>
          {evaluation.feedback ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">
                  technical: {humanize(evaluation.feedback.technicalQuality)}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  completeness: {humanize(evaluation.feedback.completeness)}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  testing: {humanize(evaluation.feedback.testingQuality)}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  docs: {humanize(evaluation.feedback.documentationQuality)}
                </Badge>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">
                {evaluation.feedback.writtenFeedback}
              </p>
              <p className="text-xs text-slate-500">
                {evaluation.feedback.revisionsRequired} revision(s) ·{" "}
                {evaluation.feedback.deadlineMet ? "on time" : "late"} · would{" "}
                {humanize(evaluation.feedback.wouldInterviewOrHire)}
              </p>
            </div>
          ) : (
            <ProjectFeedbackForm
              projectId={evaluation.projectId}
              candidateId={candidateId}
              evaluationCriteria={evaluation.evaluationCriteria}
            />
          )}
        </section>

        {evaluation.purpose === "hire" && (
          <section className="rounded-xl border bg-white p-5 space-y-4">
            <h2 className="text-lg font-semibold">Outcome</h2>
            {evaluation.outcome ? (
              <div className="text-sm space-y-1">
                <Badge variant="success" className="capitalize">
                  {humanize(evaluation.outcome.outcome)}
                </Badge>
                {evaluation.outcome.reason && (
                  <p className="text-slate-700">{evaluation.outcome.reason}</p>
                )}
                <p className="text-xs text-slate-500">
                  Recorded {formatDate(evaluation.outcome.createdAt)}
                </p>
              </div>
            ) : (
              <ProjectOutcomeForm
                projectId={evaluation.projectId}
                candidateId={candidateId}
              />
            )}
          </section>
        )}
      </>
    </div>
  );
}
