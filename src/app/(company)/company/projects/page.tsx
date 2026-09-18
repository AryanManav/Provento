import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser, getCompanyProjects } from "@/lib/data/company";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/common/status-banner";
import { CountBadge } from "@/components/notifications/count-badge";
import { getNotificationSummary } from "@/lib/data/notifications";
import { unreadByProject } from "@/lib/notifications";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyProjectsListPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { created, error } = await searchParams;

  const companyId = await getCompanyIdForUser(user.id);
  const [projects, notifications] = await Promise.all([
    companyId ? getCompanyProjects(companyId) : Promise.resolve([]),
    getNotificationSummary(user.id),
  ]);
  const updates = unreadByProject(notifications.unread);
  const latestUpdate = (projectId: string) =>
    notifications.recent.find((item) => item.projectId === projectId && !item.read);
  // Projects with something new float to the top; order is otherwise unchanged.
  const ordered = [...projects].sort(
    (a, b) => Number((updates[b.id] ?? 0) > 0) - Number((updates[a.id] ?? 0) > 0)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Evaluation projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish paid technical evaluations and review applicants.
          </p>
        </div>
        <Link href="/company/projects/create">
          <Button>Create project</Button>
        </Link>
      </div>

      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {created && (
        <StatusBanner tone="success">
          Project published and open for applications.
        </StatusBanner>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">
          No projects yet.{" "}
          <Link className="text-indigo-600 font-medium" href="/company/projects/create">
            Create your first paid evaluation.
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((project) => {
            const updateCount = updates[project.id] ?? 0;
            const latest = latestUpdate(project.id);
            return (
              <Link
                key={project.id}
                href={`/company/projects/${project.id}`}
                className={cn(
                  "group relative block overflow-hidden rounded-xl border bg-white p-5 transition-all hover:shadow-md",
                  updateCount > 0
                    ? "border-brand-300 ring-2 ring-brand-100"
                    : "border-line hover:border-brand-300"
                )}
              >
                {updateCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-brand-600"
                  />
                )}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-fib4">
                      <h2 className="font-semibold text-slate-900">{project.title}</h2>
                      {updateCount > 0 && (
                        <span className="inline-flex items-center gap-fib2 rounded-full bg-rose-50 px-fib4 py-fib1 text-xs font-semibold text-rose-600">
                          <CountBadge
                            count={updateCount}
                            className="h-4 min-w-4 text-[10px]"
                          />
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
                    <p className="mt-1 text-sm text-slate-500">
                      {project.expectedHours} hours · Apply by{" "}
                      {formatDate(project.applicationDeadline)}
                    </p>
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

                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(project.paymentAmount, project.currency)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">
                      {project.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-sm font-medium text-indigo-600 group-hover:underline">
                      Manage →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
