import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  Inbox,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import {
  getCompanyDashboardStats,
  getCompanyForUser,
  getCompanyPipeline,
} from "@/lib/data/company";
import { getNotificationSummary } from "@/lib/data/notifications";
import { pipelineStage } from "@/lib/company";
import { greetingFor } from "@/lib/next-action";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PipelineList } from "@/components/company/pipeline-list";
import { NotificationIcon } from "@/components/notifications/notification-icon";

export const dynamic = "force-dynamic";

const EMPTY_STATS = {
  totalProjects: 0,
  activeProjects: 0,
  applicants: 0,
  inProgress: 0,
  hires: 0,
  awaitingReview: 0,
};

const FIRST_STEPS = [
  {
    icon: ClipboardList,
    title: "Post a paid project",
    body: "A 5–10 hour brief with requirements, a fee, and how you'll evaluate it.",
  },
  {
    icon: Inbox,
    title: "Review applications",
    body: "Candidates read the brief before applying. Select who should build it.",
  },
  {
    icon: FileCheck2,
    title: "Evaluate real work",
    body: "Judge the submission against your criteria, then interview or hire.",
  },
];

/** A hiring workspace, not a report: what needs attention comes first. */
export default async function CompanyDashboardPage() {
  const user = await requireRole(["company", "admin"]);
  const company = await getCompanyForUser(user.id);
  const [stats, pipeline, notifications] = await Promise.all([
    company ? getCompanyDashboardStats(company.id) : Promise.resolve(EMPTY_STATS),
    company ? getCompanyPipeline(company.id) : Promise.resolve([]),
    getNotificationSummary(user.id),
  ]);

  const stageOf = (entry: (typeof pipeline)[number]) =>
    pipelineStage(entry.applicationStatus, entry.workStatus);
  const toEvaluate = pipeline.filter((entry) => stageOf(entry) === "to_evaluate");
  const toReview = pipeline.filter((entry) => stageOf(entry) === "new");
  const reviewing = pipeline.filter((entry) => stageOf(entry) === "reviewing");
  const building = pipeline.filter((entry) => stageOf(entry) === "building");
  const attention = [...toEvaluate, ...toReview];
  const evaluations = [...toEvaluate, ...building].sort(
    (a, b) =>
      new Date(a.projectDeadline).getTime() - new Date(b.projectDeadline).getTime()
  );
  const firstName = user.fullName.trim().split(/\s+/)[0] ?? "";

  const summary = [
    toEvaluate.length > 0 &&
      `${toEvaluate.length} submission${toEvaluate.length === 1 ? "" : "s"} to evaluate`,
    toReview.length > 0 &&
      `${toReview.length} new application${toReview.length === 1 ? "" : "s"}`,
  ].filter(Boolean);

  const metrics = [
    { label: "Open projects", value: stats.activeProjects, href: "/company/projects" },
    {
      label: "To review",
      value: toReview.length + reviewing.length,
      href: "/company/candidates",
    },
    {
      label: "Building",
      value: building.length,
      href: "/company/candidates?view=evaluation",
    },
    {
      label: "To evaluate",
      value: toEvaluate.length,
      href: "/company/candidates?view=evaluation",
    },
    { label: "Hires", value: stats.hires, href: "/company/candidates?view=decided" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            {greetingFor()}, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {summary.length > 0
              ? `Here's what needs your attention: ${summary.join(" and ")}.`
              : `Nothing is waiting on you${company ? ` at ${company.name}` : ""}.`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/search?type=candidates">
            <Button variant="outline">
              <Search className="h-4 w-4" aria-hidden />
              Discover talent
            </Button>
          </Link>
          <Link href="/company/projects/create">
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              Post a project
            </Button>
          </Link>
        </div>
      </header>

      {stats.totalProjects === 0 ? (
        <section className="rounded-xl border border-line bg-white p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
            Find talent through real work
          </p>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {FIRST_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="rounded-lg border border-line p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="h-4 w-4 text-ink-400" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-medium text-ink-900">{step.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{step.body}</p>
                </li>
              );
            })}
          </ol>
          <Link href="/company/projects/create" className="mt-5 inline-block">
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              Post your first project
            </Button>
          </Link>
        </section>
      ) : (
        <>
          <nav
            aria-label="Pipeline at a glance"
            className="grid grid-cols-2 divide-line overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-5 sm:divide-x"
          >
            {metrics.map((metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className="px-4 py-3 transition-colors hover:bg-ink-50"
              >
                <span className="block text-xs text-ink-500">{metric.label}</span>
                <span className="tabular mt-0.5 block text-xl font-semibold text-ink-900">
                  {metric.value}
                </span>
              </Link>
            ))}
          </nav>

          <section aria-labelledby="attention" className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 id="attention" className="text-base font-semibold text-ink-900">
                Needs your attention
              </h2>
              {attention.length > 6 && (
                <Link
                  href="/company/candidates"
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  See all {attention.length}
                </Link>
              )}
            </div>
            {attention.length === 0 ? (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-ink-200 bg-white px-4 py-5">
                <p className="text-sm text-ink-600">
                  You&apos;re all caught up. New applications and submitted work will show
                  here first.
                </p>
                <Link href="/company/projects" className="shrink-0">
                  <Button variant="outline" size="sm">
                    View projects
                  </Button>
                </Link>
              </div>
            ) : (
              <PipelineList entries={attention.slice(0, 6)} />
            )}
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <section aria-labelledby="evaluations" className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <h2 id="evaluations" className="text-base font-semibold text-ink-900">
                  Active evaluations
                </h2>
                <Link
                  href="/company/candidates?view=evaluation"
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  Pipeline
                </Link>
              </div>
              {evaluations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 bg-white px-4 py-5 text-sm text-ink-500">
                  No one is building for you right now. Select a candidate from an
                  application to start a paid evaluation.
                </p>
              ) : (
                <PipelineList entries={evaluations} detail="deadline" />
              )}
            </section>

            <section aria-labelledby="activity" className="space-y-3">
              <h2 id="activity" className="text-base font-semibold text-ink-900">
                Recent activity
              </h2>
              {notifications.recent.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 bg-white px-4 py-5 text-sm text-ink-500">
                  Applications, questions and submissions appear here as they happen.
                </p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                  {notifications.recent.slice(0, 6).map((item) => {
                    const body = (
                      <>
                        <NotificationIcon type={item.type} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink-900">
                            {item.title}
                          </span>
                          <span className="block text-xs text-ink-500">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </span>
                        {!item.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </>
                    );
                    return (
                      <li key={item.id}>
                        {item.linkUrl ? (
                          <Link
                            href={item.linkUrl}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink-50"
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-2.5">
                            {body}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/company/projects"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
              >
                Your projects
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
