import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, ClipboardList, MessageSquareText } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import {
  getApplicantProfile,
  getCompanyIdForUser,
  getProjectApplicants,
  getProjectHeader,
} from "@/lib/data/company";
import { HIRE_STAGE_DISPLAY, hireStage } from "@/lib/company";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { BriefList } from "@/components/projects/brief";
import { HiringDecision } from "@/components/company/hiring-decision";
import { ProfileIntroCard } from "@/components/candidate/profile-intro-card";
import { ProfileAboutCard } from "@/components/candidate/profile-about-card";
import { SkillsCard } from "@/components/candidate/skills-card";
import { FeaturedProjectsCard } from "@/components/candidate/featured-projects-card";
import { VerifiedHistoryCard } from "@/components/candidate/verified-history-card";
import { ApplicationStatusForm } from "@/components/company/application-status-form";
import { SectionCard } from "@/components/common/section-card";
import { StatusBanner } from "@/components/common/status-banner";
import { MarkNotificationsRead } from "@/components/notifications/mark-notifications-read";
import { formatDate } from "@/lib/utils";
import { getSelectedCandidates } from "@/lib/data/evaluation";

export const dynamic = "force-dynamic";

export default async function ApplicantProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; applicationId: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { id, applicationId } = await params;
  const { updated, error } = await searchParams;

  const [project, applicant, selected] = await Promise.all([
    getProjectHeader(id),
    getApplicantProfile(applicationId),
    getSelectedCandidates(id),
  ]);

  // The application must belong to this project, and the project to this
  // company — a guessed id from another project must not render.
  if (!project || !applicant || applicant.projectId !== project.id) notFound();
  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== project.companyId) notFound();
  }

  const selfPath = `/company/projects/${project.id}/applicants/${applicant.applicationId}`;
  const hire = project.opportunityType === "hire";
  // Hire only: openings fill with selected applications, not project work.
  const roleApplicants = hire ? await getProjectApplicants(project.id) : [];
  const hiredCount = roleApplicants.filter((a) => a.status === "selected").length;
  const work =
    roleApplicants.find((a) => a.id === applicant.applicationId)?.assessment ?? null;
  const stage = hireStage(
    applicant.status,
    project.hasAssessment ? (work?.status ?? "not_started") : null
  );

  return (
    <div className="space-y-fib6">
      <MarkNotificationsRead scopes={[{ link: selfPath }]} />
      <Link
        href={`/company/projects/${project.id}`}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        ← All applicants for {project.title}
      </Link>

      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {updated && (
        <StatusBanner tone="success">
          {updated === "selected"
            ? hire
              ? "Candidate selected for the role. They've been notified."
              : "Candidate selected. They can now see the brief and start building."
            : updated === "reviewing"
              ? "Marked under review. The candidate has been notified."
              : `Application marked as ${updated.replaceAll("_", " ")}.`}
        </StatusBanner>
      )}

      {hire && project.assessment && (
        <SectionCard
          title="Assessment"
          icon={ClipboardList}
          description={project.assessment.title}
          action={
            <StatusBadge
              size="sm"
              tone={!work ? "neutral" : work.status === "submitted" ? "success" : "info"}
              label={
                !work
                  ? "Not started"
                  : work.status === "submitted"
                    ? "Submitted"
                    : "In progress"
              }
            />
          }
        >
          {!work ? (
            <p className="text-sm text-ink-500">
              The candidate hasn&apos;t started the assessment yet. You can move them
              forward once they submit it.
            </p>
          ) : (
            <div className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-ink-500">Repository</dt>
                  <dd>
                    {work.repositoryUrl ? (
                      <a
                        href={work.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-medium text-brand-700 hover:underline"
                      >
                        {work.repositoryUrl}
                      </a>
                    ) : (
                      <span className="text-ink-400">Not provided</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Live or deployed work</dt>
                  <dd>
                    {work.liveUrl ? (
                      <a
                        href={work.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-medium text-brand-700 hover:underline"
                      >
                        {work.liveUrl}
                      </a>
                    ) : (
                      <span className="text-ink-400">Not provided</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Started</dt>
                  <dd className="text-ink-800">{formatDate(work.startedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Submitted</dt>
                  <dd className="text-ink-800">
                    {work.submittedAt ? formatDate(work.submittedAt) : "Not yet"}
                  </dd>
                </div>
              </dl>
              {work.notes && (
                <div className="rounded-md bg-ink-50 p-3">
                  <p className="text-xs font-semibold text-ink-500">Candidate notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">
                    {work.notes}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold text-ink-500">
                  Requirements the candidate marked done{" "}
                  <span className="font-normal">
                    ({work.completedRequirements.length} of{" "}
                    {project.assessment.requirements.length}, self-reported)
                  </span>
                </p>
                <ul className="space-y-1.5">
                  {project.assessment.requirements.map((requirement, index) => {
                    const done = work.completedRequirements.includes(index);
                    return (
                      <li
                        key={`${index}-${requirement}`}
                        className="flex items-start gap-2 text-sm"
                      >
                        {done ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                            aria-label="Done"
                          />
                        ) : (
                          <Circle
                            className="mt-0.5 h-4 w-4 shrink-0 text-ink-300"
                            aria-label="Not done"
                          />
                        )}
                        <span className={done ? "text-ink-800" : "text-ink-500"}>
                          {requirement}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {project.assessment.evaluationCriteria.length > 0 && (
                <div className="border-t border-line pt-3">
                  <p className="mb-2 text-xs font-semibold text-ink-500">
                    Evaluate against your criteria
                  </p>
                  <BriefList items={project.assessment.evaluationCriteria} />
                </div>
              )}
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        title="Their application"
        icon={MessageSquareText}
        action={
          <span className="text-xs text-ink-400">
            Applied {formatDate(applicant.appliedAt)}
          </span>
        }
      >
        <div className="space-y-fib5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {applicant.coverMessage}
          </p>
          {applicant.relevantExperience && (
            <div className="rounded-xl bg-ink-50 p-fib5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Relevant experience
              </p>
              <p className="mt-fib3 whitespace-pre-wrap text-sm text-ink-700">
                {applicant.relevantExperience}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-fib4 border-t border-line pt-fib5">
            <p className="text-sm text-ink-500">
              Status:{" "}
              <span className="font-semibold capitalize text-ink-800">
                {hire
                  ? HIRE_STAGE_DISPLAY[stage].label
                  : applicant.status.replaceAll("_", " ")}
              </span>
            </p>
            {hire ? (
              <HiringDecision
                applicationId={applicant.applicationId}
                status={applicant.status}
                openingsFilled={hiredCount >= project.openings}
                awaitingAssessment={project.hasAssessment && work?.status !== "submitted"}
                returnTo={selfPath}
              />
            ) : applicant.status === "selected" ? (
              <Link
                href={`/company/projects/${project.id}/review/${applicant.profile.id}`}
                className={buttonVariants()}
              >
                Evaluate work →
              </Link>
            ) : (
              <ApplicationStatusForm
                applicationId={applicant.applicationId}
                status={applicant.status}
                selectionTaken={selected.length >= project.openings}
                returnTo={selfPath}
              />
            )}
          </div>
        </div>
      </SectionCard>

      <ProfileIntroCard
        user={applicant.account}
        profile={applicant.profile}
        verifiedCount={applicant.verifiedTrials.length}
        verifiedGithub={applicant.githubUsername}
        readOnly
      />

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        <div className="space-y-fib6 lg:col-span-2">
          <VerifiedHistoryCard trials={applicant.verifiedTrials} readOnly />
          <ProfileAboutCard bio={applicant.profile.bio} readOnly />
          <FeaturedProjectsCard projects={applicant.projects} readOnly />
        </div>
        <SkillsCard skills={applicant.skills} readOnly />
      </div>
    </div>
  );
}
