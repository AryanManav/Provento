import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock,
  Hammer,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import {
  getCandidateActivityDates,
  getCandidateApplications,
  getCandidateDashboardStats,
  getCandidateProfile,
  getGithubIdentity,
} from "@/lib/data/candidate";
import { getOpenProjects } from "@/lib/data/project";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { ActivityStreak } from "@/components/candidate/activity-streak";
import { GitHubConnect } from "@/components/candidate/github-connect";
import { GithubLinkBanner } from "@/components/candidate/github-link-banner";
import { ProfileStrengthCard } from "@/components/candidate/profile-strength-card";
import { UpdatesPanel } from "@/components/notifications/updates-panel";
import { getUnreadNotifications } from "@/lib/data/notifications";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CandidateDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string }>;
}) {
  const user = await requireCandidate();
  const { github } = await searchParams;
  const profile = await getCandidateProfile(user.id);

  const [applications, activityDates, stats, openProjects, githubUsername, updates] =
    await Promise.all([
      profile ? getCandidateApplications(profile.id) : [],
      profile ? getCandidateActivityDates(profile.id) : [],
      getCandidateDashboardStats(profile),
      getOpenProjects(3),
      getGithubIdentity(),
      getUnreadNotifications(user.id),
    ]);

  return (
    <div className="space-y-fib7">
      <GithubLinkBanner status={github} />
      <div className="flex flex-col justify-between gap-fib5 border-b border-line pb-fib6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-fib2 text-sm text-ink-500">
            {profile?.headline || "Prove your ability through real, paid projects."}
          </p>
        </div>
        <Link href="/projects">
          <Button className="gap-fib3">
            <span>Browse projects</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-fib5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active trials"
          value={stats.activeTrials}
          hint="Projects you were selected for"
          icon={Hammer}
        />
        <StatCard
          label="Applications sent"
          value={applications.length}
          hint="Across all projects"
          icon={Clock}
        />
        <StatCard
          label="Verified completed"
          value={stats.completedProjects}
          hint="With a recorded evaluation"
          icon={ShieldCheck}
        />
        <StatCard
          label="Guaranteed earnings"
          value={formatCurrency(stats.earnings, DEFAULT_CURRENCY)}
          hint="From completed projects"
          icon={IndianRupee}
          tone="positive"
        />
      </div>

      <UpdatesPanel
        items={updates}
        emptyText="When a startup reviews your application, selects you, messages you or evaluates your work, it shows up here."
      />

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        <div className="space-y-fib6 lg:col-span-2">
          <section className="space-y-fib5">
            <div className="flex items-center justify-between gap-fib5">
              <h2 className="text-lg font-bold text-ink-900">Recent applications</h2>
              <Link
                href="/candidate/applications"
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                View all ({applications.length})
              </Link>
            </div>

            {applications.length === 0 ? (
              <EmptyState
                title="No applications submitted yet"
                description="Find a project matching your skills and send a proposal — every one you complete becomes verified proof."
                actionText="Explore opportunities"
                actionHref="/projects"
              />
            ) : (
              <div className="space-y-fib4">
                {applications.slice(0, 4).map((application) => (
                  <article
                    key={application.id}
                    className="flex flex-col justify-between gap-fib4 rounded-2xl border border-line bg-white p-fib6 shadow-xs sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">
                        {application.project?.title ?? "Project"}
                      </p>
                      <p className="mt-fib2 text-xs text-ink-400">
                        {application.project?.companyName ?? "Startup"} · Applied{" "}
                        {formatDate(application.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-ink-100 px-fib5 py-fib3 text-xs font-semibold capitalize text-ink-700">
                      {application.status.replaceAll("_", " ")}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-fib5">
            <div className="flex items-center justify-between gap-fib5">
              <h2 className="text-lg font-bold text-ink-900">Recommended projects</h2>
              <Link
                href="/projects"
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                Explore directory
              </Link>
            </div>

            {openProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-fib7 text-center text-sm text-ink-400">
                Startups are currently creating new projects. Check back shortly.
              </div>
            ) : (
              <div className="space-y-fib4">
                {openProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex flex-col justify-between gap-fib4 rounded-2xl border border-line bg-white p-fib6 shadow-xs transition-colors hover:border-brand-300 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">
                        {project.title}
                      </p>
                      <p className="mt-fib2 text-xs text-ink-400">
                        {project.companyName ?? "Startup"} · {project.expectedHours}h
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">
                      {formatCurrency(project.paymentAmount, project.currency)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-fib5">
          <ProfileStrengthCard
            value={stats.profileStrength}
            action={
              <Link href="/candidate/profile">
                <Button variant="outline" size="sm" className="mt-fib5 w-full gap-fib3">
                  <BriefcaseBusiness className="h-4 w-4" />
                  View &amp; edit profile
                </Button>
              </Link>
            }
          />

          <ActivityStreak activityDates={activityDates} />
          <GitHubConnect
            verifiedUsername={githubUsername}
            reportedUrl={profile?.githubUrl ?? null}
          />
        </div>
      </div>
    </div>
  );
}
