import Link from "next/link";
import { Eye } from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import {
  getCandidateDashboardStats,
  getCandidateProfile,
  getCandidateProjects,
  getCandidateSkills,
  getCandidateVerifiedTrials,
  getCandidateActivityDates,
  getGithubIdentity,
} from "@/lib/data/candidate";
import { getProfileSocial } from "@/lib/data/directory";
import { ProfileStats } from "@/components/profile/profile-stats";
import { StreakCard } from "@/components/profile/activity";
import { ProfileIntroCard } from "@/components/candidate/profile-intro-card";
import { ProfileAboutCard } from "@/components/candidate/profile-about-card";
import { SkillsCard } from "@/components/candidate/skills-card";
import { FeaturedProjectsCard } from "@/components/candidate/featured-projects-card";
import { VerifiedHistoryCard } from "@/components/candidate/verified-history-card";
import { ProfileStrengthCard } from "@/components/candidate/profile-strength-card";
import { GitHubConnect } from "@/components/candidate/github-connect";
import { GithubLinkBanner } from "@/components/candidate/github-link-banner";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string }>;
}) {
  const user = await requireCandidate();
  const { github } = await searchParams;
  const profile = await getCandidateProfile(user.id);

  const [skills, projects, verifiedTrials, stats, githubUsername, social, activityDates] =
    await Promise.all([
      profile ? getCandidateSkills(profile.id) : [],
      profile ? getCandidateProjects(profile.id) : [],
      profile ? getCandidateVerifiedTrials(profile.id) : [],
      getCandidateDashboardStats(profile),
      getGithubIdentity(),
      profile
        ? getProfileSocial({ candidateId: profile.id })
        : Promise.resolve({ followers: 0, following: 0, viewerFollows: false }),
      profile ? getCandidateActivityDates(profile.id) : [],
    ]);

  return (
    <div className="space-y-6">
      <GithubLinkBanner status={github} />

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="flex items-center gap-2 text-sm text-ink-600">
            <Eye className="h-4 w-4 text-ink-400" aria-hidden />
            Editing your profile
          </p>
          {profile && (
            <ProfileStats
              items={[
                {
                  value: social.followers,
                  label: social.followers === 1 ? "Follower" : "Followers",
                  href: `/candidates/${profile.id}/followers`,
                },
                {
                  value: social.following,
                  label: "Following",
                  href: `/candidates/${profile.id}/following`,
                },
              ]}
            />
          )}
        </div>
        {profile && (
          <Link href={`/candidates/${profile.id}`} className="shrink-0">
            <Button size="sm" variant="outline">
              View as others see it
            </Button>
          </Link>
        )}
      </div>

      <ProfileIntroCard
        user={user}
        profile={profile}
        verifiedCount={verifiedTrials.length}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Evidence first: it is the part of the profile a startup actually trusts. */}
        <div className="space-y-6 lg:col-span-2">
          <VerifiedHistoryCard trials={verifiedTrials} />
          <ProfileAboutCard bio={profile?.bio || null} />
          <FeaturedProjectsCard projects={projects} />
        </div>

        <div className="space-y-6">
          <StreakCard activityDates={activityDates} viewer="owner" heatmap={false} />
          <SkillsCard skills={skills} />
          <GitHubConnect
            verifiedUsername={githubUsername}
            reportedUrl={profile?.githubUrl ?? null}
          />
          <ProfileStrengthCard
            value={stats.profileStrength}
            checklist={stats.checklist}
          />
        </div>
      </div>
    </div>
  );
}
