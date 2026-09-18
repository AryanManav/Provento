import type { ProjectOutcomeType, ProjectStatus } from "@/lib/types/database.types";
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
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  draft: { label: "Private — hidden from Browse", tone: "neutral" },
  pending_review: { label: "Pending review", tone: "neutral" },
  published: { label: "Published", tone: "info" },
  applications_open: { label: "Accepting applications", tone: "info" },
  candidate_selected: { label: "Candidate selected", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  submitted: { label: "Work submitted — review it", tone: "warning" },
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
