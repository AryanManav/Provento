import { requireCandidate } from "@/lib/auth/guards";
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
    <div className="space-y-fib6 pb-fib8">
      <GithubLinkBanner status={github} />

      <ProfileIntroCard
        user={user}
        profile={profile}
        verifiedCount={verifiedTrials.length}
      />

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        {/* Evidence first: it is the part of the profile a startup actually trusts. */}
        <div className="space-y-fib6 lg:col-span-2">
          <VerifiedHistoryCard trials={verifiedTrials} />
          <ProfileAboutCard bio={profile?.bio || null} />
          <FeaturedProjectsCard projects={projects} />
        </div>

        <div className="space-y-fib6">
          <ProfileStrengthCard value={stats.profileStrength} />
          <SkillsCard skills={skills} />
          <GitHubConnect
            verifiedUsername={githubUsername}
            reportedUrl={profile?.githubUrl ?? null}
          />
        </div>
      </div>
    </div>
  );
}
