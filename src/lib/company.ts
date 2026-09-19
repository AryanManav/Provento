import type {
  ApplicationStatus,
  OpportunityType,
  ProjectOutcomeType,
  ProjectStatus,
  SelectionWorkStatus,
} from "@/lib/types/database.types";
import type { StatusTone } from "@/lib/status";
import { COMPANY_SETUP_MIN_DESCRIPTION } from "@/lib/constants";
import type { CompanyView } from "@/lib/types/domain";

/**
 * What candidates look at before applying, in the order they notice it. Each
 * missing item is one less reason to trust a paid project from an unknown
 * startup.
 */
const PROFILE_FIELDS: { key: keyof CompanyView; label: string }[] = [
  { key: "name", label: "Company name" },
  { key: "logoUrl", label: "Logo" },
  { key: "description", label: "What you build" },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "companySize", label: "Team size" },
  { key: "location", label: "Location" },
];

export function companyProfileCompleteness(company: CompanyView | null): {
  percent: number;
  missing: string[];
} {
  const missing = PROFILE_FIELDS.filter(({ key }) => {
    const value = company?.[key];
    return typeof value !== "string" || value.trim() === "";
  }).map(({ label }) => label);
  const done = PROFILE_FIELDS.length - missing.length;
  return { percent: Math.round((done / PROFILE_FIELDS.length) * 100), missing };
}

/** A company-facing label for each project status, plus whether it needs them. */
export const COMPANY_PROJECT_STATUS: Record<
  ProjectStatus,
  { label: string; tone: StatusTone }
> = {
  draft: { label: "Private", tone: "neutral" },
  pending_review: { label: "Pending review", tone: "neutral" },
  published: { label: "Open", tone: "success" },
  applications_open: { label: "Open", tone: "success" },
  candidate_selected: { label: "Candidate selected", tone: "active" },
  in_progress: { label: "In progress", tone: "active" },
  submitted: { label: "Work submitted", tone: "attention" },
  under_review: { label: "Under review", tone: "warning" },
  revision_requested: { label: "Revision requested", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const OUTCOME_LABEL: Record<ProjectOutcomeType, string> = {
  hire: "Hired",
  interview: "Moved to interview",
  talent_pool: "Added to talent pool",
  no_hire: "Not hired",
  candidate_withdrew: "Candidate withdrew",
  project_cancelled: "Project cancelled",
};

/**
 * True once a company has the basics candidates need — the same rule the
 * database enforces before it accepts a project (company_ready_to_post).
 */
export function isCompanyReadyToPost(
  company: Pick<
    CompanyView,
    "name" | "description" | "industry" | "companySize" | "location"
  > | null
): boolean {
  if (!company) return false;
  const filled = (value: string | null) => (value ?? "").trim().length > 0;
  return (
    company.name.trim().length >= 2 &&
    (company.description ?? "").trim().length >= COMPANY_SETUP_MIN_DESCRIPTION &&
    filled(company.industry) &&
    filled(company.companySize) &&
    filled(company.location)
  );
}

/**
 * Where one application stands in a company's hiring pipeline. Once a
 * candidate is selected, their own work status decides.
 */
export type PipelineStage =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "hired"
  | "building"
  | "to_evaluate"
  | "accepted"
  | "not_accepted"
  | "rejected"
  | "withdrawn"
  | "cancelled";

export function pipelineStage(
  applicationStatus: ApplicationStatus,
  workStatus: SelectionWorkStatus | null,
  opportunityType: OpportunityType = "build"
): PipelineStage {
  if (applicationStatus === "withdrawn") return "withdrawn";
  if (applicationStatus === "rejected") return "rejected";
  if (applicationStatus === "shortlisted") return "shortlisted";
  if (applicationStatus === "interview") return "interview";
  if (applicationStatus !== "selected") {
    return applicationStatus === "submitted" ? "new" : "reviewing";
  }
  // Hire only: selection is the hire — there's no work to follow.
  if (opportunityType === "hire") return "hired";
  switch (workStatus) {
    case "submitted":
    case "under_review":
      return "to_evaluate";
    case "completed":
      return "accepted";
    case "not_accepted":
      return "not_accepted";
    case "cancelled":
      return "cancelled";
    default:
      return "building";
  }
}

export const PIPELINE_DISPLAY: Record<
  PipelineStage,
  { label: string; tone: StatusTone; action: string }
> = {
  new: { label: "New application", tone: "attention", action: "Review application" },
  reviewing: { label: "Reviewing", tone: "warning", action: "Decide" },
  shortlisted: { label: "Shortlisted", tone: "active", action: "Review candidate" },
  interview: { label: "Interview", tone: "warning", action: "Decide" },
  hired: { label: "Hired", tone: "success", action: "View application" },
  building: { label: "Building", tone: "active", action: "Open evaluation" },
  to_evaluate: { label: "Work submitted", tone: "attention", action: "Evaluate work" },
  accepted: { label: "Accepted", tone: "success", action: "View evaluation" },
  not_accepted: { label: "Not accepted", tone: "danger", action: "View evaluation" },
  rejected: { label: "Not selected", tone: "neutral", action: "View application" },
  withdrawn: { label: "Withdrawn", tone: "neutral", action: "View application" },
  cancelled: { label: "Cancelled", tone: "neutral", action: "View evaluation" },
};

/** The pipeline views on the Candidates page, and the stages each holds. */
export const PIPELINE_VIEWS = {
  all: { label: "All", stages: null },
  review: {
    label: "To review",
    stages: ["new", "reviewing", "shortlisted", "interview"],
  },
  evaluation: { label: "In evaluation", stages: ["building", "to_evaluate"] },
  decided: {
    label: "Decided",
    stages: ["hired", "accepted", "not_accepted", "rejected", "withdrawn", "cancelled"],
  },
} as const satisfies Record<string, { label: string; stages: PipelineStage[] | null }>;

export type PipelineView = keyof typeof PIPELINE_VIEWS;

/** Where an entry opens: the application before selection, the evaluation after. */
export function pipelineHref(entry: {
  projectId: string;
  applicationId: string;
  candidateId: string;
  applicationStatus: ApplicationStatus;
  opportunityType?: OpportunityType;
}): string {
  return entry.applicationStatus === "selected" && entry.opportunityType !== "hire"
    ? `/company/projects/${entry.projectId}/review/${entry.candidateId}`
    : `/company/projects/${entry.projectId}/applicants/${entry.applicationId}`;
}

/** A hire-only application as the company sees it in the hiring pipeline. */
export const HIRE_STAGE_DISPLAY: Record<
  ApplicationStatus,
  { label: string; tone: StatusTone }
> = {
  submitted: { label: "New", tone: "attention" },
  reviewing: { label: "New", tone: "attention" },
  shortlisted: { label: "Shortlisted", tone: "active" },
  interview: { label: "Interview", tone: "warning" },
  selected: { label: "Selected", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

/** The hiring pipeline's tabs, and the application statuses each shows. */
export const HIRE_TABS = {
  all: { label: "All", statuses: null },
  new: { label: "New", statuses: ["submitted", "reviewing"] },
  shortlisted: { label: "Shortlisted", statuses: ["shortlisted"] },
  interview: { label: "Interview", statuses: ["interview"] },
  selected: { label: "Selected", statuses: ["selected"] },
  rejected: { label: "Rejected", statuses: ["rejected"] },
} as const satisfies Record<
  string,
  { label: string; statuses: ApplicationStatus[] | null }
>;

export type HireTab = keyof typeof HIRE_TABS;

export function inHireTab(tab: HireTab, status: ApplicationStatus): boolean {
  const statuses: readonly ApplicationStatus[] | null = HIRE_TABS[tab].statuses;
  return statuses === null || statuses.includes(status);
}
