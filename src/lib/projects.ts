import { BROWSABLE_PROJECT_STATUSES, OPEN_PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types/database.types";

/**
 * Where a project stands for someone browsing:
 * - open: taking applications
 * - full: open, but its applicant cap is reached
 * - selected: a candidate was picked and is working on it
 * - closed: past its application deadline, finished, or cancelled
 */
export type ProjectAvailability = "open" | "full" | "selected" | "closed";

export function projectAvailability(
  project: {
    status: ProjectStatus;
    applicationDeadline: string;
    maxApplicants: number | null;
    applicationCount: number;
  },
  now: Date = new Date()
): ProjectAvailability {
  if (
    !(BROWSABLE_PROJECT_STATUSES as readonly ProjectStatus[]).includes(project.status)
  ) {
    return "closed";
  }
  if (new Date(project.applicationDeadline).getTime() <= now.getTime()) return "closed";
  if (!(OPEN_PROJECT_STATUSES as readonly ProjectStatus[]).includes(project.status)) {
    return "selected";
  }
  if (
    project.maxApplicants !== null &&
    project.applicationCount >= project.maxApplicants
  ) {
    return "full";
  }
  return "open";
}

/** Places left under the cap, or null when there is no cap. */
export function spotsLeft(maxApplicants: number | null, applicationCount: number) {
  return maxApplicants === null ? null : Math.max(0, maxApplicants - applicationCount);
}

/** "Hiring · 2 openings" / "Paid build — no hiring", for Browse and the brief. */
export function purposeLabel(project: {
  purpose: "hire" | "build";
  openings: number;
}): string {
  return project.purpose === "hire"
    ? `Hiring · ${project.openings} opening${project.openings === 1 ? "" : "s"}`
    : "Paid build — no hiring";
}
