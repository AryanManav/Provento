import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser } from "@/lib/data/company";
import { getEvaluation } from "@/lib/data/evaluation";
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

export const dynamic = "force-dynamic";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function ProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { id } = await params;

  const evaluation = await getEvaluation(id);
  if (!evaluation) notFound();

  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== evaluation.companyId) notFound();
  }

  const messages = evaluation.candidate
    ? await getProjectThread(id, evaluation.candidate.id, user.id)
    : [];
  const evidence = computeThreadEvidence(messages);

  return (
    <div className="max-w-4xl space-y-5">
      <MarkNotificationsRead scopes={[{ link: `/company/projects/${id}/review` }]} />
      <Link href={`/company/projects/${id}`} className="text-sm text-indigo-600">
        ← Applicants
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{evaluation.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate delivered work · Due {formatDate(evaluation.projectDeadline)}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {humanize(evaluation.status)}
        </Badge>
      </div>

      {!evaluation.candidate ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">
          Select a candidate from the applicants list before running an evaluation.
        </div>
      ) : (
        <>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Candidate under evaluation
            </h2>
            <p className="font-semibold mt-1">{evaluation.candidate.name}</p>
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
            messages={messages}
            viewer="company"
          />

          <section className="rounded-xl border bg-white p-5 space-y-3">
            <h2 className="text-lg font-bold">
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
                        {submission.reviewedAt &&
                          ` · ${formatDate(submission.reviewedAt)}`}
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
            <h2 className="text-lg font-bold">Evaluation</h2>
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
                evaluationCriteria={evaluation.evaluationCriteria}
              />
            )}
          </section>

          <section className="rounded-xl border bg-white p-5 space-y-4">
            <h2 className="text-lg font-bold">Outcome</h2>
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
              <ProjectOutcomeForm projectId={evaluation.projectId} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
