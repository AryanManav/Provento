import Link from "next/link";
import { Plus } from "lucide-react";
import { getBrowseProjects } from "@/lib/data/project";
import { getCurrentUser } from "@/lib/auth/guards";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { BrowseProjectCard } from "@/components/projects/browse-project-card";
import { cn } from "@/lib/utils";
import type { ProjectCategory } from "@/lib/types/database.types";
import type { BrowseProjectView } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = Object.keys(PROJECT_CATEGORIES) as ProjectCategory[];

function isCategory(value: string | undefined): value is ProjectCategory {
  return !!value && (CATEGORY_ORDER as string[]).includes(value);
}

/**
 * Browse, in sections by topic. A chip narrows it to one topic.
 */
export default async function ProjectsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = isCategory(category) ? category : null;
  const [projects, user] = await Promise.all([getBrowseProjects(), getCurrentUser()]);

  // Posting is for startups and visitors; candidates only browse here.
  const postHref =
    user?.role === "company" || user?.role === "admin"
      ? "/company/projects/create"
      : user
        ? null
        : "/signup?role=company";

  const byCategory = new Map<ProjectCategory, BrowseProjectView[]>();
  for (const project of projects) {
    const list = byCategory.get(project.category) ?? [];
    list.push(project);
    byCategory.set(project.category, list);
  }
  const sections = CATEGORY_ORDER.filter(
    (key) => (byCategory.get(key)?.length ?? 0) > 0 && (!selected || key === selected)
  );
  const openCount = projects.filter((project) => project.availability === "open").length;
  const firstName = user?.role === "candidate" ? user.fullName.split(" ")[0] : null;

  return (
    <div className="mx-auto max-w-6xl space-y-fib6 px-fib5 py-fib7 sm:px-fib6">
      <div className="flex flex-col justify-between gap-fib5 border-b border-line pb-fib6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">
            {firstName ? `Find your next project, ${firstName}` : "Browse projects"}
          </h1>
          <p className="mt-fib2 text-sm text-ink-500">
            {openCount} paid project{openCount === 1 ? "" : "s"} open right now, from
            startups that evaluate real work before they hire.
          </p>
        </div>
        {postHref && (
          <Link href={postHref}>
            <Button variant="outline" className="gap-fib2">
              <Plus className="h-4 w-4" />
              Post a project
            </Button>
          </Link>
        )}
      </div>

      {projects.length > 0 && (
        <nav aria-label="Topics" className="flex gap-fib2 overflow-x-auto pb-fib1">
          <Link
            href="/projects"
            aria-current={!selected ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-fib5 py-fib2 text-sm font-semibold transition-colors",
              !selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-white text-ink-600 hover:border-ink-300"
            )}
          >
            All · {projects.length}
          </Link>
          {CATEGORY_ORDER.filter((key) => byCategory.has(key)).map((key) => (
            <Link
              key={key}
              href={`/projects?category=${key}`}
              aria-current={selected === key ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-fib5 py-fib2 text-sm font-semibold transition-colors",
                selected === key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-white text-ink-600 hover:border-ink-300"
              )}
            >
              {PROJECT_CATEGORIES[key].label} · {byCategory.get(key)?.length}
            </Link>
          ))}
        </nav>
      )}

      {projects.length === 0 ? (
        <EmptyState
          title="No open projects right now"
          description="Startups post new paid trial projects regularly. Check back soon — every open project is listed here."
        />
      ) : sections.length === 0 ? (
        <EmptyState
          title="Nothing in this topic yet"
          description="No open projects in this topic right now. Browse all topics instead."
          actionText="Show all projects"
          actionHref="/projects"
        />
      ) : (
        sections.map((key) => (
          <section key={key} className="space-y-fib4" aria-labelledby={`topic-${key}`}>
            <div className="flex items-end justify-between gap-fib4">
              <div>
                <h2 id={`topic-${key}`} className="text-xl font-bold text-ink-900">
                  {PROJECT_CATEGORIES[key].label}
                </h2>
                <p className="text-sm text-ink-500">{PROJECT_CATEGORIES[key].blurb}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-400">
                {byCategory.get(key)?.length}
              </span>
            </div>
            <div className="grid gap-fib5 md:grid-cols-2 lg:grid-cols-3">
              {byCategory.get(key)?.map((project) => (
                <BrowseProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
