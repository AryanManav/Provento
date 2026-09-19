import { requireRole } from "@/lib/auth/guards";
import { getCompanyHistory, getCompanyIdForUser } from "@/lib/data/company";
import { PageHeader } from "@/components/common/page-header";
import { FilterChips } from "@/components/ui/filter-chips";
import {
  HISTORY_GROUPS,
  HistoryList,
  historyGroup,
  type HistoryGroup,
} from "@/components/company/history-list";

export const dynamic = "force-dynamic";

const GROUPS = Object.keys(HISTORY_GROUPS) as HistoryGroup[];

/**
 * Everything the company has finished: roles filled, projects completed, and
 * opportunities closed early. They leave Browse, never the record.
 */
export default async function CompanyHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { show } = await searchParams;
  const active = GROUPS.includes(show as HistoryGroup) ? (show as HistoryGroup) : null;

  const companyId = await getCompanyIdForUser(user.id);
  const history = companyId
    ? await getCompanyHistory(companyId, { withPeople: true })
    : [];
  const byGroup = Object.fromEntries(
    GROUPS.map((group) => [
      group,
      history.filter((entry) => historyGroup(entry) === group),
    ])
  ) as Record<HistoryGroup, typeof history>;

  const hired = byGroup.hires.reduce((total, entry) => total + entry.hired, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="Finished opportunities stay on record after they leave Browse — who you hired, what was built, and what closed."
      />

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-4">
        {[
          { label: "Roles filled", value: byGroup.hires.length },
          { label: "Candidates hired", value: hired },
          { label: "Projects completed", value: byGroup.projects.length },
          { label: "Closed", value: byGroup.closed.length },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col-reverse border-line px-4 py-3 [&:not(:last-child)]:border-r"
          >
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd className="tabular text-xl font-semibold text-ink-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      <FilterChips
        label="History"
        active={active ?? "all"}
        chips={[
          { id: "all", label: "All", href: "/company/history", count: history.length },
          ...GROUPS.map((group) => ({
            id: group,
            label: HISTORY_GROUPS[group].title,
            href: `/company/history?show=${group}`,
            count: byGroup[group].length,
          })),
        ]}
      />

      {(active ? [active] : GROUPS).map((group) => (
        <section key={group} aria-labelledby={`history-${group}`} className="space-y-2">
          <h2 id={`history-${group}`} className="text-sm font-semibold text-ink-900">
            {HISTORY_GROUPS[group].title}
          </h2>
          <HistoryList group={group} entries={byGroup[group]} owner />
        </section>
      ))}
    </div>
  );
}
