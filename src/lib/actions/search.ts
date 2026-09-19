"use server";

import { getCurrentUser } from "@/lib/auth/guards";
import { searchEverything } from "@/lib/data/search";
import { companyProfilePath } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

/** One row in the search overlay. */
export interface QuickSearchItem {
  kind: "project" | "candidate" | "company";
  id: string;
  title: string;
  meta: string;
  href: string;
  imageUrl: string | null;
}

export interface QuickSearchResponse {
  query: string;
  groups: {
    kind: QuickSearchItem["kind"];
    label: string;
    total: number;
    items: QuickSearchItem[];
  }[];
}

const PER_GROUP = 4;

/**
 * Live results for the navbar search overlay, grouped and trimmed. Read-only,
 * and runs through the same RLS-scoped queries as the search page.
 */
export async function quickSearchAction(query: unknown): Promise<QuickSearchResponse> {
  const q = typeof query === "string" ? query.trim().slice(0, 80) : "";
  const user = await getCurrentUser();
  if (!user || q.length < 2) return { query: q, groups: [] };

  const { projects, candidates, companies } = await searchEverything(q);

  const groups: QuickSearchResponse["groups"] = [
    {
      kind: "project" as const,
      label: "Projects",
      total: projects.length,
      items: projects.slice(0, PER_GROUP).map((project) => ({
        kind: "project" as const,
        id: project.id,
        title: project.title,
        meta: [
          project.companyName ?? "Startup",
          formatCurrency(project.paymentAmount, project.currency),
          project.availability === "open" ? "Open" : "Closed to applications",
        ].join(" · "),
        href: `/projects/${project.slug}`,
        imageUrl: null,
      })),
    },
    {
      kind: "candidate" as const,
      label: "Candidates",
      total: candidates.length,
      items: candidates.slice(0, PER_GROUP).map((candidate) => ({
        kind: "candidate" as const,
        id: candidate.id,
        title: candidate.title,
        meta: [
          candidate.subtitle ?? "Candidate",
          candidate.verifiedCount > 0 ? `${candidate.verifiedCount} verified` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/candidates/${candidate.id}`,
        imageUrl: candidate.imageUrl,
      })),
    },
    {
      kind: "company" as const,
      label: "Companies",
      total: companies.length,
      items: companies.slice(0, PER_GROUP).map((company) => ({
        kind: "company" as const,
        id: company.id,
        title: company.title,
        meta: [
          company.subtitle ?? "Startup",
          company.location,
          company.openProjects > 0 ? `${company.openProjects} open` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        href: companyProfilePath(company.id),
        imageUrl: company.imageUrl,
      })),
    },
  ].filter((group) => group.items.length > 0);

  return { query: q, groups };
}
