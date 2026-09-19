import Link from "next/link";
import { Archive, BriefcaseBusiness, Hammer, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleBadge } from "@/components/profile/role-badge";
import { OpportunityBadge } from "@/components/projects/opportunity-badge";
import { formatCurrency, formatMonth } from "@/lib/utils";
import type { CompanyHistoryEntry } from "@/lib/types/domain";

export type HistoryGroup = "hires" | "projects" | "closed";

/** Which list a finished opportunity belongs in. */
export function historyGroup(entry: CompanyHistoryEntry): HistoryGroup {
  if (entry.status === "cancelled") return "closed";
  return entry.opportunityType === "hire" ? "hires" : "projects";
}

export const HISTORY_GROUPS: Record<
  HistoryGroup,
  { title: string; icon: LucideIcon; empty: string }
> = {
  hires: {
    title: "Successful hires",
    icon: BriefcaseBusiness,
    empty: "Roles move here once every opening is filled.",
  },
  projects: {
    title: "Completed projects",
    icon: Hammer,
    empty: "Build projects move here once the delivered work is accepted.",
  },
  closed: {
    title: "Closed opportunities",
    icon: Archive,
    empty: "Roles closed and projects withdrawn before finishing appear here.",
  },
};

function summary(entry: CompanyHistoryEntry): string {
  const applications = `${entry.applications} application${entry.applications === 1 ? "" : "s"}`;
  if (entry.opportunityType === "hire") {
    return [
      `${entry.hired} / ${entry.openings} candidates hired`,
      applications,
      entry.assessmentTitle && `Assessment: ${entry.assessmentTitle}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    formatCurrency(entry.paymentAmount, entry.currency),
    entry.accepted > 0 ? "1 candidate selected" : null,
    applications,
  ]
    .filter(Boolean)
    .join(" · ");
}

function statusOf(entry: CompanyHistoryEntry) {
  if (entry.status === "cancelled") {
    return {
      label: entry.opportunityType === "hire" ? "Closed" : "Withdrawn",
      tone: "neutral" as const,
    };
  }
  return {
    label: entry.opportunityType === "hire" ? "Hiring complete" : "Completed",
    tone: "success" as const,
  };
}

/**
 * One group of finished opportunities as a dense list. On the company's own
 * screens rows link to the full record and name who was hired; on the public
 * profile they are counts only.
 */
export function HistoryList({
  group,
  entries,
  owner = false,
  limit,
}: {
  group: HistoryGroup;
  entries: CompanyHistoryEntry[];
  /** The company's own view: link each row and show who was hired. */
  owner?: boolean;
  limit?: number;
}) {
  const meta = HISTORY_GROUPS[group];
  const shown = limit ? entries.slice(0, limit) : entries;

  if (entries.length === 0) {
    return (
      <EmptyState
        compact
        icon={meta.icon}
        title="Nothing here yet"
        description={meta.empty}
      />
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {shown.map((entry) => {
        const status = statusOf(entry);
        const verb = entry.status === "cancelled" ? "Closed" : "Completed";
        return (
          <li key={entry.projectId} className="px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {owner ? (
                    <Link
                      href={
                        entry.opportunityType === "hire"
                          ? `/company/projects/${entry.projectId}`
                          : `/company/projects/${entry.projectId}/review`
                      }
                      className="text-sm font-semibold text-ink-900 hover:text-brand-700 hover:underline"
                    >
                      {entry.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-ink-900">
                      {entry.title}
                    </span>
                  )}
                  <OpportunityBadge type={entry.opportunityType} size="sm" />
                </div>
                <p className="text-xs text-ink-500">
                  {summary(entry)} · {verb} {formatMonth(entry.closedAt)}
                </p>
              </div>
              <StatusBadge size="sm" tone={status.tone} label={status.label} />
            </div>

            {owner && entry.people.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {entry.people.map((person) => (
                  <li key={person.candidateId}>
                    <Link
                      href={`/candidates/${person.candidateId}`}
                      className="inline-flex items-center gap-1.5 text-xs text-ink-700 hover:text-brand-700"
                    >
                      <Avatar
                        name={person.name}
                        src={person.avatarUrl}
                        className="h-5 w-5 rounded-full text-[9px]"
                      />
                      <span className="font-medium">{person.name}</span>
                      <RoleBadge role="candidate" size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
