import type { SearchResult } from "@/lib/types/domain";

export const SEARCH_TYPES = ["all", "projects", "candidates", "companies"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/** People and company filters on the search page (projects reuse ProjectFilters). */
export interface DirectoryFilters {
  skill: string;
  location: string;
  /** Candidates with at least one piece of accepted work. */
  verifiedOnly: boolean;
  /** Companies with a project open right now. */
  hiringOnly: boolean;
}

export function parseSearchType(value: string | undefined): SearchType {
  return (SEARCH_TYPES as readonly string[]).includes(value ?? "")
    ? (value as SearchType)
    : "all";
}

export function parseDirectoryFilters(
  params: Record<string, string | undefined>
): DirectoryFilters {
  return {
    skill: (params.skill ?? "").trim().slice(0, 40),
    location: (params.location ?? "").trim().slice(0, 40),
    verifiedOnly: params.verified === "1",
    hiringOnly: params.hiring === "1",
  };
}

function includes(haystack: string | null | undefined, needle: string): boolean {
  return !needle || (haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}

export function filterCandidates(
  results: SearchResult[],
  filters: DirectoryFilters
): SearchResult[] {
  return results.filter(
    (result) =>
      includes(result.location, filters.location) &&
      (!filters.skill || result.skills.some((skill) => includes(skill, filters.skill))) &&
      (!filters.verifiedOnly || result.verifiedCount > 0)
  );
}

export function filterCompanies(
  results: SearchResult[],
  filters: DirectoryFilters
): SearchResult[] {
  return results.filter(
    (result) =>
      includes(result.location, filters.location) &&
      (!filters.skill || result.skills.some((skill) => includes(skill, filters.skill))) &&
      (!filters.hiringOnly || result.openProjects > 0)
  );
}
