import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { OpportunityBadge } from "@/components/projects/opportunity-badge";
import { OPEN_PROJECT_STATUSES } from "@/lib/constants";
import { pipelineStage } from "@/lib/company";
import type { CompanyProjectView, PipelineEntry } from "@/lib/types/domain";
import type { OpportunityType, ProjectStatus } from "@/lib/types/database.types";

function isOpen(status: ProjectStatus): boolean {
  return (OPEN_PROJECT_STATUSES as readonly ProjectStatus[]).includes(status);
}

/**
 * Hiring and build projects are different jobs with different numbers, so
 * they get separate panels — never one blended metric. Every figure is
 * counted from real postings and applications.
 */
export function OpportunitySummary({
  projects,
  pipeline,
}: {
  projects: CompanyProjectView[];
  pipeline: PipelineEntry[];
}) {
  const of = (type: OpportunityType) => ({
    projects: projects.filter((project) => project.opportunityType === type),
    entries: pipeline.filter((entry) => entry.opportunityType === type),
  });
  const stage = (entry: PipelineEntry) =>
    pipelineStage(entry.applicationStatus, entry.workStatus, entry.opportunityType);

  const hire = of("hire");
  const hiredByProject = new Map<string, number>();
  for (const entry of hire.entries) {
    if (stage(entry) === "hired") {
      hiredByProject.set(entry.projectId, (hiredByProject.get(entry.projectId) ?? 0) + 1);
    }
  }
  const openHire = hire.projects.filter((project) => isOpen(project.status));
  const openPositions = openHire.reduce(
    (total, project) =>
      total + Math.max(0, project.openings - (hiredByProject.get(project.id) ?? 0)),
    0
  );
  const hiring = [
    { label: "Open positions", value: openPositions },
    {
      label: "Applications",
      value: hire.entries.filter((entry) => entry.applicationStatus !== "withdrawn")
        .length,
    },
    {
      label: "In interview",
      value: hire.entries.filter((entry) => stage(entry) === "interview").length,
    },
    {
      label: "Selected",
      value: hire.entries.filter((entry) => stage(entry) === "hired").length,
    },
  ];

  const build = of("build");
  const buildNumbers = [
    {
      label: "Active projects",
      value: build.projects.filter((p) => isOpen(p.status)).length,
    },
    {
      label: "Applicants",
      value: build.entries.filter((entry) => entry.applicationStatus !== "withdrawn")
        .length,
    },
    {
      label: "In progress",
      value: build.entries.filter((entry) =>
        ["building", "to_evaluate"].includes(stage(entry))
      ).length,
    },
    {
      label: "Completed",
      value: build.entries.filter((entry) => stage(entry) === "accepted").length,
    },
  ];

  const panels = [
    {
      type: "hire" as const,
      title: "Hiring",
      postings: `${openHire.length} open role${openHire.length === 1 ? "" : "s"}`,
      numbers: hiring,
      empty: "No active hiring opportunities. Post a role to start receiving candidates.",
      cta: "Post a role",
      has: hire.projects.length > 0,
    },
    {
      type: "build" as const,
      title: "Build projects",
      postings: `${build.projects.length} project${build.projects.length === 1 ? "" : "s"}`,
      numbers: buildNumbers,
      empty:
        "No active build projects. Create a project and find a candidate to complete it.",
      cta: "Create a project",
      has: build.projects.length > 0,
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {panels.map((panel) => (
        <section
          key={panel.type}
          aria-labelledby={`summary-${panel.type}`}
          className="rounded-xl border border-line bg-surface"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h2
                id={`summary-${panel.type}`}
                className="text-sm font-semibold text-ink-900"
              >
                {panel.title}
              </h2>
              <OpportunityBadge type={panel.type} size="sm" />
            </div>
            <Link
              href={`/company/projects?type=${panel.type}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
            >
              {panel.postings}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </header>
          {panel.has ? (
            <dl className="grid grid-cols-2 sm:grid-cols-4">
              {panel.numbers.map((number) => (
                <div
                  key={number.label}
                  className="flex flex-col-reverse border-line px-4 py-3 [&:not(:last-child)]:border-r"
                >
                  <dt className="text-xs text-ink-500">{number.label}</dt>
                  <dd className="tabular text-xl font-semibold text-ink-900">
                    {number.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="flex flex-col items-start gap-3 px-4 py-4">
              <p className="text-sm text-ink-500">{panel.empty}</p>
              <Link
                href={`/company/projects/create?type=${panel.type}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {panel.cta}
              </Link>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
