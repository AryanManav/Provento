import Link from "next/link";
import { BriefcaseBusiness, PlusCircle, Trophy, UserCheck, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyDashboardStats, getCompanyIdForUser } from "@/lib/data/company";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { UpdatesPanel } from "@/components/notifications/updates-panel";
import { getUnreadNotifications } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

export default async function CompanyDashboardPage() {
  const user = await requireRole(["company", "admin"]);
  const [companyId, updates] = await Promise.all([
    getCompanyIdForUser(user.id),
    getUnreadNotifications(user.id),
  ]);
  const stats = companyId
    ? await getCompanyDashboardStats(companyId)
    : {
        totalProjects: 0,
        activeProjects: 0,
        applicants: 0,
        inProgress: 0,
        hires: 0,
        awaitingReview: 0,
      };

  return (
    <div className="space-y-fib7">
      <div className="flex flex-col justify-between gap-fib5 border-b border-line pb-fib6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Hiring dashboard</h1>
          <p className="mt-fib2 text-sm text-ink-500">
            Evaluate emerging technical talent through paid work before hiring.
          </p>
        </div>
        <Link href="/company/projects/create">
          <Button className="gap-fib3">
            <PlusCircle className="h-4 w-4" />
            <span>Create trial project</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-fib5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          hint="Accepting applications"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Awaiting review"
          value={stats.awaitingReview}
          hint={`${stats.applicants} applicant${stats.applicants === 1 ? "" : "s"} in total`}
          icon={Users}
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          hint="Being completed by a candidate"
          icon={UserCheck}
        />
        <StatCard
          label="Hires made"
          value={stats.hires}
          hint="From project evaluations"
          icon={Trophy}
          tone="positive"
        />
      </div>

      <UpdatesPanel
        items={updates}
        emptyText="New applicants, questions from your candidate and submitted work show up here."
      />

      <section className="space-y-fib5">
        <h2 className="text-lg font-bold text-ink-900">Evaluation funnel</h2>

        {stats.totalProjects === 0 ? (
          <EmptyState
            title="No evaluation projects yet"
            description="Create a standardized 5–10 hour project with a real budget, linked to an open junior technical role."
            actionText="Create your first project"
            actionHref="/company/projects/create"
          />
        ) : (
          <div className="rounded-2xl border border-line bg-white p-fib7">
            <p className="text-sm text-ink-500">
              You have {stats.totalProjects} project
              {stats.totalProjects === 1 ? "" : "s"}, {stats.applicants} applicant
              {stats.applicants === 1 ? "" : "s"}, and {stats.inProgress} evaluation
              {stats.inProgress === 1 ? "" : "s"} in flight.
            </p>
            <Link
              href="/company/projects"
              className="mt-fib5 inline-flex text-sm font-semibold text-brand-600 hover:underline"
            >
              Manage projects →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
