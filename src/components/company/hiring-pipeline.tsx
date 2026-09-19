import Link from "next/link";
import { CalendarClock, Users } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { LinkTabs } from "@/components/ui/tabs";
import { RoleBadge } from "@/components/profile/role-badge";
import { SkillTags } from "@/components/search/result-rows";
import { HiringDecision } from "@/components/company/hiring-decision";
import { HIRE_STAGE_DISPLAY, HIRE_TABS, inHireTab, type HireTab } from "@/lib/company";
import { cn, formatDate } from "@/lib/utils";
import type { ApplicantView } from "@/lib/types/domain";
import type { ProjectStatus } from "@/lib/types/database.types";

/**
 * A hire-only posting's applicants: how many of the openings are filled, how
 * close the posting is to its application limit, and each candidate moving
 * through Applied → Shortlisted → Interview → Selected.
 */
export function HiringPipeline({
  project,
  applicants,
  tab,
  unreadApplicants,
}: {
  project: {
    id: string;
    status: ProjectStatus;
    openings: number;
    maxApplicants: number | null;
    applicationDeadline: string;
  };
  applicants: ApplicantView[];
  tab: HireTab;
  /** Application ids with an unread notification. */
  unreadApplicants: Set<string>;
}) {
  const projectPath = `/company/projects/${project.id}`;
  const selected = applicants.filter((a) => a.status === "selected").length;
  const received = applicants.filter((a) => a.status !== "withdrawn").length;
  const filled = selected >= project.openings;
  const limitReached =
    project.maxApplicants !== null && received >= project.maxApplicants;
  const shown = applicants.filter((a) => inHireTab(tab, a.status));

  const statusLine = filled
    ? "Hiring complete — every opening is filled."
    : project.status === "draft"
      ? "Private — hidden from candidates."
      : project.status === "cancelled"
        ? "Withdrawn."
        : limitReached
          ? "Applications closed — the limit is reached. Review and select from those received."
          : new Date(project.applicationDeadline).getTime() < Date.now()
            ? "Applications closed — the deadline has passed."
            : "Open for applications.";

  return (
    <div className="space-y-5">
      <section
        aria-label="Hiring status"
        className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2"
      >
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-ink-900">Positions filled</p>
            <p className="tabular text-sm text-ink-700">
              <span className="font-semibold text-ink-900">{selected}</span> /{" "}
              {project.openings}
            </p>
          </div>
          <ProgressBar
            value={(selected / project.openings) * 100}
            label="Positions filled"
            tone={filled ? "success" : "brand"}
            className="mt-2"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            {filled
              ? "All openings filled"
              : `${project.openings - selected} position${project.openings - selected === 1 ? "" : "s"} remaining`}
          </p>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-ink-900">Applications</p>
            <p className="tabular text-sm text-ink-700">
              <span className="font-semibold text-ink-900">{received}</span>
              {project.maxApplicants !== null && <> / {project.maxApplicants}</>}
            </p>
          </div>
          {project.maxApplicants !== null && (
            <ProgressBar
              value={(received / project.maxApplicants) * 100}
              label="Applications received"
              className="mt-2"
            />
          )}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            Apply by {formatDate(project.applicationDeadline)}
          </p>
        </div>
        <p className="border-t border-line pt-3 text-sm text-ink-600 sm:col-span-2">
          {statusLine}
        </p>
      </section>

      <LinkTabs
        label="Hiring stage"
        active={tab}
        tabs={(Object.keys(HIRE_TABS) as HireTab[]).map((id) => ({
          id,
          label: HIRE_TABS[id].label,
          href: id === "all" ? projectPath : `${projectPath}?stage=${id}`,
          count: applicants.filter((a) => inHireTab(id, a.status)).length,
        }))}
      />

      {applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applications yet"
          description="Candidates who apply appear here with their profile, skills and verified work."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          compact
          icon={Users}
          title={`No one is ${HIRE_TABS[tab].label.toLowerCase()} yet`}
          description="Candidates move here as you progress them through hiring."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {shown.map((applicant) => {
            const display = HIRE_STAGE_DISPLAY[applicant.status];
            const applicantPath = `${projectPath}/applicants/${applicant.id}`;
            return (
              <li
                key={applicant.id}
                className={cn(
                  "flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center",
                  unreadApplicants.has(applicant.id) && "bg-accent-50/40"
                )}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <Avatar
                    name={applicant.candidateName}
                    src={applicant.candidateAvatarUrl}
                    className="h-10 w-10 rounded-full text-xs"
                  />
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={applicantPath}
                        className="text-sm font-medium text-ink-900 hover:text-brand-700 hover:underline"
                      >
                        {applicant.candidateName}
                      </Link>
                      <RoleBadge role="candidate" size="sm" />
                      <StatusBadge size="sm" tone={display.tone} label={display.label} />
                    </div>
                    <p className="truncate text-xs text-ink-500">
                      {applicant.candidateHeadline ?? "Candidate"} · Applied{" "}
                      {formatDate(applicant.appliedAt)}
                    </p>
                    <SkillTags skills={applicant.candidateSkills} limit={5} />
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 pl-[3.25rem] lg:items-end lg:pl-0">
                  <HiringDecision
                    applicationId={applicant.id}
                    status={applicant.status}
                    openingsFilled={filled}
                    stage={tab === "all" ? undefined : tab}
                  />
                  <Link
                    href={applicantPath}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    View profile and application
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
