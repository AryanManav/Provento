import Link from "next/link";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { LinkTabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { CompanyProjectResult, CompanyProjectView } from "@/lib/types/domain";

export type CompanyProjectsTab = "active" | "completed";

function ProjectRow({
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
    <li className={cn(updateCount > 0 && "bg-accent-50/40")}>
      <Link
        href={
          closed
            ? `/company/projects/${project.id}/review`
            : `/company/projects/${project.id}`
        }
        className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-ink-50 md:flex-row md:items-center"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-ink-900 group-hover:text-brand-700">
              {project.title}
            </h2>
            {updateCount > 0 && (
              <span className="rounded bg-accent-100 px-1.5 text-2xs font-medium text-accent-800">
                {updateCount} new
              </span>
            )}
          </div>

          {closed ? (
            <p className="text-xs text-ink-500">
              {!result || result.candidates.length === 0
                ? "No candidate completed it"
                : result.candidates
                    .map(
                      (candidate) =>
                        `${candidate.name} · ${
                          project.purpose === "build"
                            ? "Built it"
                            : candidate.outcome
                              ? OUTCOME_LABEL[candidate.outcome]
                              : "Outcome not recorded yet"
                        }`
                    )
                    .join("  ·  ")}
            </p>
          ) : (
            <p className="text-xs text-ink-500">
              {project.expectedHours}h · Apply by{" "}
              {formatDate(project.applicationDeadline)}
              {project.awaitingReview > 0 && (
                <span className="font-medium text-accent-700">
                  {" "}
                  · {project.awaitingReview} new applicant
                  {project.awaitingReview === 1 ? "" : "s"}
                </span>
              )}
            </p>
          )}

          {latest && (
            <p className="truncate text-xs text-ink-600">
              {latest.title}
              <span className="text-ink-400">
                {" "}
                · {formatRelativeTime(latest.createdAt)}
              </span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="tabular text-sm font-medium text-emerald-700">
            {formatCurrency(project.paymentAmount, project.currency)}
          </span>
          <StatusBadge size="sm" tone={status.tone} label={status.label} />
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-brand-700 md:ml-0">
            {closed ? "Evaluations" : "Manage"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
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
  deleted,
  error,
}: {
  userId: string;
  tab: CompanyProjectsTab;
  created?: string;
  deleted?: string;
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PageHeader
          title="Projects"
          description="Your paid projects: who's applying, who's building, and the work you've evaluated."
          actions={
            <Link href="/company/projects/create">
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                Post a project
              </Button>
            </Link>
          }
        />
        <LinkTabs
          label="Project views"
          active={tab}
          tabs={[
            {
              id: "active",
              label: "Live",
              href: "/company/projects",
              count: counts.active,
            },
            {
              id: "completed",
              label: "Finished",
              href: "/company/projects/completed",
              count: counts.completed,
            },
          ]}
        />
      </div>

      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {deleted && <StatusBanner tone="success">Project deleted.</StatusBanner>}
      {created && (
        <StatusBanner tone="success">
          Project published and open for applications.
        </StatusBanner>
      )}

      {ordered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={tab === "active" ? "No live projects" : "No finished projects yet"}
          description={
            tab === "active"
              ? "Post a paid project to start finding talent through real work."
              : "Projects move here once every selected candidate's work is evaluated, or the project is cancelled."
          }
          actionText={tab === "active" ? "Post a project" : undefined}
          actionHref={tab === "active" ? "/company/projects/create" : undefined}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {ordered.map((project) => {
            const latest = notifications.recent.find(
              (item) => item.projectId === project.id && !item.read
            );
            return (
              <ProjectRow
                key={project.id}
                project={project}
                updateCount={updates[project.id] ?? 0}
                latest={latest}
                result={results.get(project.id)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
