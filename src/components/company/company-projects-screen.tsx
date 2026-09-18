import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getCompanyIdForUser,
  getCompanyProjectResults,
  getCompanyProjects,
} from "@/lib/data/company";
import { getNotificationSummary } from "@/lib/data/notifications";
import { unreadByProject } from "@/lib/notifications";
import { isClosedProject } from "@/lib/applications";
import { COMPANY_PROJECT_STATUS, OUTCOME_LABEL } from "@/lib/company";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/common/status-banner";
import { CountBadge } from "@/components/notifications/count-badge";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { CompanyProjectResult, CompanyProjectView } from "@/lib/types/domain";

export type CompanyProjectsTab = "active" | "completed";

const TABS: { id: CompanyProjectsTab; label: string; href: string }[] = [
  { id: "active", label: "Active", href: "/company/projects" },
  { id: "completed", label: "Completed", href: "/company/projects/completed" },
];

const TONES = {
  neutral: "bg-ink-100 text-ink-700",
  info: "bg-brand-50 text-brand-700",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-rose-50 text-rose-700",
} as const;

function ProjectCard({
  project,
  updateCount,
  latest,
  result,
}: {
  project: CompanyProjectView;
  updateCount: number;
  latest?: { title: string; createdAt: string };
  result?: CompanyProjectResult;
}) {
  const status = COMPANY_PROJECT_STATUS[project.status];
  const closed = isClosedProject(project.status);

  return (
    <Link
      href={
        closed
          ? `/company/projects/${project.id}/review`
          : `/company/projects/${project.id}`
      }
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-white p-fib6 shadow-xs transition-all hover:shadow-md",
        updateCount > 0
          ? "border-brand-300 ring-2 ring-brand-100"
          : "border-line hover:border-brand-300"
      )}
    >
      {updateCount > 0 && (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand-600" />
      )}
      <div className="flex flex-col justify-between gap-fib4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-fib4">
            <h2 className="font-semibold text-ink-900">{project.title}</h2>
            {updateCount > 0 && (
              <span className="inline-flex items-center gap-fib2 rounded-full bg-rose-50 px-fib4 py-fib1 text-xs font-semibold text-rose-600">
                <CountBadge count={updateCount} className="h-4 min-w-4 text-[10px]" />
                {updateCount === 1 ? "update" : "updates"}
              </span>
            )}
            {project.awaitingReview > 0 && (
              <span className="rounded-full bg-brand-600 px-fib4 py-fib1 text-xs font-semibold text-white">
                {project.awaitingReview} new applicant
                {project.awaitingReview === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {closed ? (
            <p className="mt-fib2 text-sm text-ink-500">
              {result?.candidateName ? (
                <>
                  Built by{" "}
                  <span className="font-semibold text-ink-700">
                    {result.candidateName}
                  </span>
                </>
              ) : (
                "No candidate completed it"
              )}
              {" · "}
              {result?.outcome ? (
                <span className="font-semibold text-ink-700">
                  {OUTCOME_LABEL[result.outcome]}
                </span>
              ) : (
                <span className="text-amber-700">Outcome not recorded yet</span>
              )}
            </p>
          ) : (
            <p className="mt-fib2 text-sm text-ink-500">
              {project.expectedHours} hours · Apply by{" "}
              {formatDate(project.applicationDeadline)}
            </p>
          )}

          {latest && (
            <p className="mt-fib3 truncate text-sm text-ink-700">
              <span className="font-semibold">{latest.title}</span>
              <span className="text-ink-400">
                {" "}
                · {formatRelativeTime(latest.createdAt)}
              </span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-fib4">
          <span className="font-semibold text-emerald-700">
            {formatCurrency(project.paymentAmount, project.currency)}
          </span>
          <span
            className={cn(
              "rounded-full px-fib5 py-fib2 text-xs font-semibold",
              TONES[status.tone]
            )}
          >
            {status.label}
          </span>
          <span className="text-sm font-semibold text-brand-600 group-hover:underline">
            {closed ? "View evaluation →" : "Manage →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * The company's projects, split across two routes: live ones (released or
 * being built) and finished ones (evaluated or cancelled).
 */
export async function CompanyProjectsScreen({
  userId,
  tab,
  created,
  error,
}: {
  userId: string;
  tab: CompanyProjectsTab;
  created?: string;
  error?: string;
}) {
  const companyId = await getCompanyIdForUser(userId);
  const [projects, notifications] = await Promise.all([
    companyId ? getCompanyProjects(companyId) : Promise.resolve([]),
    getNotificationSummary(userId),
  ]);

  const active = projects.filter((project) => !isClosedProject(project.status));
  const completed = projects.filter((project) => isClosedProject(project.status));
  const shown = tab === "active" ? active : completed;
  const results =
    tab === "completed"
      ? await getCompanyProjectResults(completed.map((project) => project.id))
      : new Map<string, CompanyProjectResult>();

  const updates = unreadByProject(notifications.unread);
  const counts = { active: active.length, completed: completed.length };
  // Projects with something new float to the top; order is otherwise unchanged.
  const ordered = [...shown].sort(
    (a, b) => Number((updates[b.id] ?? 0) > 0) - Number((updates[a.id] ?? 0) > 0)
  );
  const unreadIn = (list: CompanyProjectView[]) =>
    list.reduce((total, project) => total + (updates[project.id] ?? 0), 0);

  return (
    <div className="space-y-fib6">
      <div className="flex flex-col justify-between gap-fib5 border-b border-line pb-fib6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Evaluation projects</h1>
          <p className="mt-fib2 text-sm text-ink-500">
            Publish paid technical evaluations, review applicants and evaluate delivered
            work.
          </p>
        </div>
        <Link href="/company/projects/create">
          <Button className="gap-fib3">
            <Plus className="h-4 w-4" />
            Create project
          </Button>
        </Link>
      </div>

      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {created && (
        <StatusBanner tone="success">
          Project published and open for applications.
        </StatusBanner>
      )}

      <nav
        aria-label="Project views"
        className="inline-flex rounded-xl border border-line bg-white p-fib2"
      >
        {TABS.map((item) => {
          const current = item.id === tab;
          const unread = unreadIn(item.id === "active" ? active : completed);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-fib3 rounded-lg px-fib5 py-fib3 text-sm font-semibold transition-colors",
                current ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-fib3 text-xs",
                  current ? "bg-white/20" : "bg-ink-100 text-ink-500"
                )}
              >
                {counts[item.id]}
              </span>
              {!current && <CountBadge count={unread} />}
            </Link>
          );
        })}
      </nav>

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-fib8 text-center text-sm text-ink-500">
          {tab === "active" ? (
            <>
              No live projects.{" "}
              <Link
                className="font-semibold text-brand-600"
                href="/company/projects/create"
              >
                Create a paid evaluation →
              </Link>
            </>
          ) : (
            "Finished projects appear here once you accept a submission or cancel a project."
          )}
        </div>
      ) : (
        <div className="space-y-fib4">
          {ordered.map((project) => {
            const latest = notifications.recent.find(
              (item) => item.projectId === project.id && !item.read
            );
            return (
              <ProjectCard
                key={project.id}
                project={project}
                updateCount={updates[project.id] ?? 0}
                latest={latest}
                result={results.get(project.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
