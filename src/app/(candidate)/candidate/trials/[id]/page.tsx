import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  Laptop,
  Send,
} from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import { getCandidateProfileId, getCandidateVerifiedTrials } from "@/lib/data/candidate";
import { isClosedProject } from "@/lib/applications";
import { getCandidateTrial } from "@/lib/data/trial";
import { MarkNotificationsRead } from "@/components/notifications/mark-notifications-read";
import { getProjectThread } from "@/lib/data/thread";
import { SubmitWorkForm } from "@/components/candidate/submit-work-form";
import { ProjectThread } from "@/components/common/project-thread";
import { SectionCard } from "@/components/common/section-card";
import { AttachmentList } from "@/components/common/attachment-list";
import { WORK_MODES, companyProfilePath } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function CriteriaList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-fib3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
        {title}
      </h3>
      <ul className="list-disc space-y-fib2 pl-fib6 text-sm text-ink-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const LOCAL_STEPS = [
  {
    icon: GitBranch,
    text: "Create a repository and commit as you go — the history is evidence.",
  },
  { icon: Laptop, text: "Build in your own tools, against the acceptance criteria." },
  { icon: FileCheck2, text: "Ask below if anything in the brief is unclear." },
  { icon: Send, text: "Submit the repository, plus any files a repo can't hold." },
];

export default async function CandidateTrialWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCandidate();
  const { id } = await params;

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) notFound();

  const [trial, messages, verified] = await Promise.all([
    getCandidateTrial(candidateId, id),
    getProjectThread(id, candidateId, user.id),
    getCandidateVerifiedTrials(candidateId),
  ]);
  if (!trial) notFound();
  const closed = isClosedProject(trial.status);
  const evaluation = verified.find((item) => item.projectId === trial.projectId);

  const latest = trial.submissions[0];
  const mode = WORK_MODES[trial.workMode];

  return (
    <div className="space-y-fib6 pb-fib8">
      <MarkNotificationsRead scopes={[{ projectId: id }]} />
      <Link
        href="/candidate/trials"
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← Trial projects
      </Link>

      <section className="rounded-2xl border border-line bg-white p-fib6 shadow-xs">
        <div className="flex flex-col justify-between gap-fib5 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-fib4">
              <span className="rounded-full bg-brand-50 px-fib5 py-fib2 text-xs font-semibold text-brand-700">
                {mode.label}
              </span>
              <span className="rounded-full bg-ink-100 px-fib5 py-fib2 text-xs font-semibold capitalize text-ink-700">
                {trial.status.replaceAll("_", " ")}
              </span>
            </div>
            <h1 className="mt-fib4 text-2xl font-bold text-ink-900">{trial.title}</h1>
            <Link
              href={companyProfilePath(trial.companyId)}
              className="mt-fib2 inline-block text-sm text-ink-500 hover:text-brand-600 hover:underline"
            >
              {trial.companyName || "Startup"}
            </Link>
          </div>
          <div className="shrink-0 space-y-fib2 text-left sm:text-right">
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(trial.paymentAmount, trial.currency)}
            </p>
            <p className="flex items-center gap-fib2 text-sm text-ink-500 sm:justify-end">
              <CalendarClock className="h-4 w-4" />
              Due {formatDate(trial.projectDeadline)} · {trial.expectedHours}h
            </p>
          </div>
        </div>
      </section>

      {closed && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-fib6">
          <div className="flex items-start gap-fib4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 space-y-fib3">
              <h2 className="font-bold text-emerald-900">
                {trial.status === "completed" ? "Project completed" : "Project cancelled"}
              </h2>
              {evaluation ? (
                <>
                  <p className="text-sm text-emerald-900">
                    Requirements{" "}
                    {evaluation.requirementsCompleted
                      ? "completed"
                      : "not fully completed"}{" "}
                    · Technical quality:{" "}
                    <span className="font-semibold capitalize">
                      {evaluation.technicalQuality.replaceAll("_", " ")}
                    </span>
                    {evaluation.outcome && (
                      <>
                        {" "}
                        · Outcome:{" "}
                        <span className="font-semibold capitalize">
                          {evaluation.outcome.replaceAll("_", " ")}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-emerald-900/80">
                    {evaluation.writtenFeedback}
                  </p>
                </>
              ) : (
                <p className="text-sm text-emerald-900/80">
                  {trial.status === "completed"
                    ? "Your work was accepted. The startup's written feedback will appear here once they record it."
                    : "The startup closed this project. Your submissions stay below for reference."}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        <div className="space-y-fib6 lg:col-span-2">
          <SectionCard title="The brief" icon={FileCheck2}>
            <div className="space-y-fib6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {trial.problemStatement}
              </p>
              {trial.context && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-500">
                  {trial.context}
                </p>
              )}
              <CriteriaList title="Requirements" items={trial.requirements} />
              <CriteriaList title="Deliverables" items={trial.deliverables} />
              <CriteriaList
                title="Acceptance criteria"
                items={trial.acceptanceCriteria}
              />
              <CriteriaList
                title="How this will be evaluated"
                items={trial.evaluationCriteria}
              />
            </div>
          </SectionCard>

          {!closed && (
            <SectionCard
              title={latest ? "Submit a revision" : "Submit your work"}
              icon={Send}
            >
              {trial.canSubmit ? (
                <SubmitWorkForm
                  projectId={trial.projectId}
                  userId={user.id}
                  isResubmission={Boolean(latest)}
                />
              ) : (
                <p className="text-sm text-ink-500">
                  This project isn&rsquo;t accepting submissions right now — its status is{" "}
                  <span className="font-medium capitalize">
                    {trial.status.replaceAll("_", " ")}
                  </span>
                  .
                </p>
              )}
            </SectionCard>
          )}

          {trial.submissions.length > 0 && (
            <SectionCard
              title="Your submissions"
              icon={GitBranch}
              count={trial.submissions.length}
            >
              <div className="space-y-fib5">
                {trial.submissions.map((submission) => (
                  <article
                    key={submission.id}
                    className="space-y-fib4 rounded-xl border border-line p-fib5"
                  >
                    <div className="flex items-center justify-between gap-fib4">
                      <span className="text-xs text-ink-400">
                        Submitted {formatDate(submission.submittedAt)}
                      </span>
                      <span className="rounded-full bg-ink-100 px-fib4 py-fib1 text-xs font-semibold capitalize text-ink-700">
                        {submission.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <a
                      href={submission.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-sm font-medium text-brand-600 hover:underline"
                    >
                      {submission.repositoryUrl}
                    </a>
                    <p className="whitespace-pre-wrap text-sm text-ink-700">
                      {submission.submissionNotes}
                    </p>
                    <AttachmentList attachments={submission.attachments} />
                  </article>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-fib6">
          <section className="rounded-2xl border border-line bg-white p-fib6 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              How to work on this
            </h2>
            <ol className="mt-fib5 space-y-fib5">
              {LOCAL_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.text} className="flex gap-fib4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm text-ink-600">
                      <span className="font-semibold text-ink-800">{index + 1}.</span>{" "}
                      {step.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          <ProjectThread
            projectId={trial.projectId}
            messages={messages}
            viewer="candidate"
          />
        </div>
      </div>
    </div>
  );
}
