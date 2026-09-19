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
  getGithubIdentity,
} from "@/lib/data/candidate";
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

  const [skills, projects, verifiedTrials, stats, githubUsername] = await Promise.all([
    profile ? getCandidateSkills(profile.id) : [],
    profile ? getCandidateProjects(profile.id) : [],
    profile ? getCandidateVerifiedTrials(profile.id) : [],
    getCandidateDashboardStats(profile),
    getGithubIdentity(),
  ]);

  return (
    <div className="space-y-6">
      <GithubLinkBanner status={github} />

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-sm text-ink-600">
          <Eye className="h-4 w-4 text-ink-400" aria-hidden />
          Editing your profile. Startups see your verified work first.
        </p>
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
