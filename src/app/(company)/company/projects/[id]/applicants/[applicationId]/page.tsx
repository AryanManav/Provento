import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import {
  getApplicantProfile,
  getCompanyIdForUser,
  getProjectHeader,
} from "@/lib/data/company";
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
import { getSelectedCandidateId } from "@/lib/data/evaluation";

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

  const [project, applicant, selectedCandidateId] = await Promise.all([
    getProjectHeader(id),
    getApplicantProfile(applicationId),
    getSelectedCandidateId(id),
  ]);

  // The application must belong to this project, and the project to this
  // company — a guessed id from another project must not render.
  if (!project || !applicant || applicant.projectId !== project.id) notFound();
  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== project.companyId) notFound();
  }

  const selfPath = `/company/projects/${project.id}/applicants/${applicant.applicationId}`;

  return (
    <div className="space-y-fib6">
      <MarkNotificationsRead scopes={[{ link: selfPath }]} />
      <Link
        href={`/company/projects/${project.id}`}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← All applicants for {project.title}
      </Link>

      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {updated && (
        <StatusBanner tone="success">
          {updated === "selected"
            ? "Candidate selected. They can now see the brief and start building."
            : `Application marked as ${updated.replaceAll("_", " ")}.`}
        </StatusBanner>
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
                {applicant.status.replaceAll("_", " ")}
              </span>
            </p>
            <ApplicationStatusForm
              applicationId={applicant.applicationId}
              status={applicant.status}
              selectionTaken={selectedCandidateId !== null}
              returnTo={selfPath}
            />
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
