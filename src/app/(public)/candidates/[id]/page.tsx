import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, Cpu, GraduationCap, MapPin, Pencil } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCandidatePublicProfile, getFollowStats } from "@/lib/data/directory";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/common/follow-button";
import { SectionCard } from "@/components/common/section-card";
import { FeaturedProjectsCard } from "@/components/candidate/featured-projects-card";
import { ProfileHeader, type ProfileLink } from "@/components/profile/profile-header";
import { VerifiedWorkList } from "@/components/profile/verified-work-list";

export const dynamic = "force-dynamic";

/**
 * A candidate's technical identity: who they are, what they've built, and —
 * first — what startups verified they delivered. Only candidates who keep
 * "Show my profile in search" on have one, and it never includes contact
 * details.
 */
export default async function CandidatePublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/candidates/${id}`);

  const [candidate, stats] = await Promise.all([
    getCandidatePublicProfile(id),
    getFollowStats({ candidateId: id }),
  ]);
  if (!candidate) notFound();

  const links = [
    { href: candidate.githubUrl, label: "GitHub" },
    { href: candidate.portfolioUrl, label: "Portfolio" },
    { href: candidate.linkedinUrl, label: "LinkedIn" },
  ].filter((link): link is ProfileLink => !!link.href);

  const education = candidate.education
    ? `${candidate.education}${candidate.graduationYear ? ` · ${candidate.graduationYear}` : ""}`
    : null;

  return (
    <div className="bg-ink-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <ProfileHeader
          name={candidate.fullName}
          imageUrl={candidate.avatarUrl}
          bannerUrl={candidate.bannerUrl}
          headline={candidate.headline}
          badges={
            candidate.verifiedProjects > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                Verified work
              </span>
            )
          }
          facts={[
            candidate.location && { icon: MapPin, text: candidate.location },
            education && { icon: GraduationCap, text: education },
          ].filter((fact): fact is { icon: typeof MapPin; text: string } =>
            Boolean(fact)
          )}
          links={links}
          stats={[
            { label: "verified projects", value: candidate.verifiedProjects },
            { label: "self-reported projects", value: candidate.projects.length },
            { label: "skills", value: candidate.skills.length },
          ]}
          actions={
            candidate.isSelf ? (
              <Link href="/candidate/profile">
                <Button variant="outline" size="sm">
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit profile
                </Button>
              </Link>
            ) : (
              <FollowButton target={{ candidateId: candidate.id }} initial={stats} />
            )
          }
        />

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {candidate.bio && (
              <SectionCard title="About">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {candidate.bio}
                </p>
              </SectionCard>
            )}

            <VerifiedWorkList
              emptyText={`${candidate.fullName} hasn't completed a paid project on Trialent yet.`}
              items={candidate.verifiedWork.map((work) => ({
                key: work.projectId,
                title: work.title,
                companyId: work.companyId,
                companyName: work.companyName,
                date: work.acceptedAt,
                detail: `${PROJECT_CATEGORIES[work.category]?.label ?? "Project"} · ${work.expectedHours}h`,
                stack: work.stack,
              }))}
            />

            <FeaturedProjectsCard
              readOnly
              projects={candidate.projects.map((project, index) => ({
                id: `${index}-${project.title}`,
                ...project,
              }))}
            />
          </div>

          <aside className="space-y-6">
            <SectionCard title="Skills" icon={Cpu} count={candidate.skills.length}>
              {candidate.skills.length === 0 ? (
                <p className="text-sm text-ink-500">No skills listed yet.</p>
              ) : (
                <ul className="-my-1 divide-y divide-line">
                  {candidate.skills.map((skill) => (
                    <li key={skill.name} className="flex items-center gap-2 py-1.5">
                      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-900">
                        {skill.name}
                      </span>
                      {skill.level && (
                        <span className="shrink-0 text-xs capitalize text-ink-500">
                          {skill.level}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <p className="px-1 text-xs leading-relaxed text-ink-500">
              <BadgeCheck
                className="mr-1 inline h-3.5 w-3.5 text-emerald-600"
                aria-hidden
              />
              <span className="font-medium text-ink-700">Verified work</span> is paid
              project work a startup reviewed and accepted on Trialent. Self-reported
              projects are added by the candidate.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
