import { CLOSED_PROJECT_STATUSES } from "@/lib/constants";
import type { ApplicationStatus, ProjectStatus } from "@/lib/types/database.types";
import type { ApplicationSummaryView } from "@/lib/types/domain";

/**
 * Where an application stands from the candidate's side. The application
 * status stops at "selected"; after that the project's own status says what is
 * happening, so the two are combined here once instead of in every page.
 */
export type ApplicationStage =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "building"
  | "awaiting_review"
  | "revision_requested"
  | "completed"
  | "cancelled"
  | "not_selected"
  | "withdrawn";

export function isClosedProject(status: ProjectStatus | null | undefined): boolean {
  return (
    !!status && (CLOSED_PROJECT_STATUSES as readonly ProjectStatus[]).includes(status)
  );
}

export function applicationStage(
  applicationStatus: ApplicationStatus,
  projectStatus: ProjectStatus | null | undefined
): ApplicationStage {
  switch (applicationStatus) {
    case "withdrawn":
      return "withdrawn";
    case "rejected":
      return "not_selected";
    case "reviewing":
      return "reviewing";
    case "shortlisted":
      return "shortlisted";
    case "submitted":
      return "applied";
    case "selected":
      if (projectStatus === "completed") return "completed";
      if (projectStatus === "cancelled") return "cancelled";
      if (projectStatus === "revision_requested") return "revision_requested";
      if (projectStatus === "submitted" || projectStatus === "under_review") {
        return "awaiting_review";
      }
      return "building";
  }
}

/** Selected candidates go to their workspace; everyone else to the brief. */
export function applicationHref(application: ApplicationSummaryView): string | null {
  if (!application.project) return null;
  return application.status === "selected"
    ? `/candidate/trials/${application.project.id}`
    : `/projects/${application.project.slug}`;
}

export const STAGE_DISPLAY: Record<
  ApplicationStage,
  {
    label: string;
    tone: "neutral" | "info" | "warning" | "success" | "danger";
    action: string;
  }
> = {
  applied: { label: "Application sent", tone: "neutral", action: "View brief" },
  reviewing: { label: "Under review", tone: "warning", action: "View brief" },
  shortlisted: { label: "Shortlisted", tone: "info", action: "View brief" },
  building: { label: "In progress", tone: "info", action: "Open workspace" },
  awaiting_review: {
    label: "Submitted — awaiting review",
    tone: "warning",
    action: "Open workspace",
  },
  revision_requested: {
    label: "Revision requested",
    tone: "danger",
    action: "Open workspace",
  },
  completed: { label: "Project completed", tone: "success", action: "View results" },
  cancelled: { label: "Project cancelled", tone: "neutral", action: "View workspace" },
  not_selected: { label: "Not selected", tone: "neutral", action: "View brief" },
  withdrawn: { label: "Withdrawn", tone: "neutral", action: "View brief" },
};
