import { BROWSABLE_PROJECT_STATUSES, OPEN_PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectCategory, ProjectStatus } from "@/lib/types/database.types";

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

/** Browse filters, parsed from the query string. Everything is optional. */
export interface ProjectFilters {
  q: string;
  category: ProjectCategory | null;
  /** Minimum fee, in the project's currency units. */
  minPay: number | null;
  /** Maximum expected hours. */
  maxHours: number | null;
  openOnly: boolean;
}

export const PAY_FILTERS = [
  { value: "2000", label: "₹2,000+" },
  { value: "5000", label: "₹5,000+" },
  { value: "10000", label: "₹10,000+" },
] as const;

export const HOURS_FILTERS = [
  { value: "5", label: "Up to 5 hours" },
  { value: "10", label: "Up to 10 hours" },
  { value: "20", label: "Up to 20 hours" },
] as const;

function positiveNumber(value: string | undefined): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseProjectFilters(
  params: Record<string, string | undefined>,
  categories: readonly string[]
): ProjectFilters {
  const category = params.category;
  return {
    q: (params.q ?? "").trim().slice(0, 80),
    category:
      category && categories.includes(category) ? (category as ProjectCategory) : null,
    minPay: positiveNumber(params.pay),
    maxHours: positiveNumber(params.hours),
    openOnly: params.open === "1",
  };
}

/** True when any filter narrows the list (sections by topic show otherwise). */
export function hasActiveFilters(filters: ProjectFilters): boolean {
  return (
    filters.q !== "" ||
    filters.minPay !== null ||
    filters.maxHours !== null ||
    filters.openOnly
  );
}

/** Title, description, company and stack all match the search words. */
export function filterProjects<
  T extends {
    title: string;
    description: string;
    companyName: string | null;
    stack: string[];
    category: ProjectCategory;
    paymentAmount: number;
    expectedHours: number;
    availability: ProjectAvailability;
  },
>(projects: T[], filters: ProjectFilters): T[] {
  const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter((project) => {
    if (filters.category && project.category !== filters.category) return false;
    if (filters.minPay !== null && project.paymentAmount < filters.minPay) return false;
    if (filters.maxHours !== null && project.expectedHours > filters.maxHours)
      return false;
    if (filters.openOnly && project.availability !== "open") return false;
    if (words.length === 0) return true;
    const haystack = [
      project.title,
      project.description,
      project.companyName ?? "",
      ...project.stack,
    ]
      .join(" ")
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
