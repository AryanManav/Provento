import Link from "next/link";
import {
  BadgeCheck,
  Cpu,
  Flame,
  GraduationCap,
  Lock,
  MapPin,
  Pencil,
} from "lucide-react";
import { buildActivityCalendar } from "@/lib/activity";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/common/follow-button";
import { SectionCard } from "@/components/common/section-card";
import { FeaturedProjectsCard } from "@/components/candidate/featured-projects-card";
import { ProfileHeader, type ProfileLink } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { StreakCard } from "@/components/profile/activity";
import { VerifiedWorkList } from "@/components/profile/verified-work-list";
import type { CandidatePublicView, ProfileSocial } from "@/lib/types/domain";

/**
 * A candidate's technical identity. Within a glance: who they are, that
 * they're a candidate, what they do, how active they are, what startups
 * verified they delivered, who follows them — and whether you can follow.
 */
export function CandidateProfile({
  candidate,
  social,
}: {
  candidate: CandidatePublicView;
  social: ProfileSocial;
}) {
  const base = `/candidates/${candidate.id}`;
  const { streak } = buildActivityCalendar(candidate.activityDates);
  const firstName = candidate.fullName.split(" ")[0];

  const links = [
    { href: candidate.githubUrl, label: "GitHub" },
    { href: candidate.portfolioUrl, label: "Portfolio" },
    { href: candidate.linkedinUrl, label: "LinkedIn" },
  ].filter((link): link is ProfileLink => !!link.href);

  const education = candidate.education
    ? `${candidate.education}${candidate.graduationYear ? ` · ${candidate.graduationYear}` : ""}`
    : null;

  return (
    <div className="space-y-6">
      <ProfileHeader
        role="candidate"
        name={candidate.fullName}
        imageUrl={candidate.avatarUrl}
        bannerUrl={candidate.bannerUrl}
        headline={candidate.headline}
        badges={
          candidate.verifiedProjects > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              {candidate.verifiedProjects} verified project
              {candidate.verifiedProjects === 1 ? "" : "s"}
            </span>
          )
        }
        social={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ProfileStats
              items={[
                {
                  value: social.followers,
                  label: social.followers === 1 ? "Follower" : "Followers",
                  href: `${base}/followers`,
                },
                {
                  value: social.following,
                  label: "Following",
                  href: `${base}/following`,
                },
              ]}
            />
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-ink-600">
                <span aria-hidden className="text-ink-300">
                  ·
                </span>
                <Flame className="h-4 w-4 text-accent-500" aria-hidden />
                <span className="tabular font-semibold text-ink-900">{streak}</span>
                -day streak
              </span>
            )}
          </div>
        }
        facts={[
          candidate.location && { icon: MapPin, text: candidate.location },
          education && { icon: GraduationCap, text: education },
        ].filter((fact): fact is { icon: typeof MapPin; text: string } => Boolean(fact))}
        links={links}
        actions={
          candidate.isSelf ? (
            <Link href="/candidate/profile">
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit profile
              </Button>
            </Link>
          ) : (
            <FollowButton
              target={{ candidateId: candidate.id }}
              following={social.viewerFollows}
              name={candidate.fullName}
            />
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
            emptyText={`${firstName} hasn't completed a paid project on Trialent yet.`}
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
          <StreakCard
            activityDates={candidate.activityDates}
            viewer={candidate.isSelf ? "owner" : "public"}
            firstName={firstName}
          />

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
  );
}

/** What a hidden profile shows: that it exists, and nothing about the person. */
export function PrivateProfile() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-line bg-white px-6 py-12 text-center">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-line bg-ink-50 text-ink-400">
        <Lock className="h-5 w-5" aria-hidden />
      </span>
      <h1 className="mt-3 text-base font-semibold text-ink-900">
        This profile is private
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        This candidate has chosen not to show their profile in search. Startups they apply
        to can still see it.
      </p>
      <Link href="/search?type=candidates" className="mt-5 inline-block">
        <Button variant="outline" size="sm">
          Discover other candidates
        </Button>
      </Link>
    </div>
  );
}
