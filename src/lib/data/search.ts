import { getBrowseProjects } from "@/lib/data/project";
import { MIN_SEARCH_LENGTH, searchDirectory } from "@/lib/data/directory";
import { filterProjects, type ProjectFilters } from "@/lib/projects";
import type { BrowseProjectView, SearchResult } from "@/lib/types/domain";

export interface SearchResults {
  projects: BrowseProjectView[];
  candidates: SearchResult[];
  companies: SearchResult[];
}

const NO_FILTERS: Omit<ProjectFilters, "q"> = {
  category: null,
  minPay: null,
  maxHours: null,
  openOnly: false,
};

/**
 * One search across the product: projects (title, description, company,
 * stack), candidates (name, headline, location, skills) and companies (name,
 * industry, location, stack). Open projects rank first.
 *
 * `browse` lists everything when the query is empty — the Discover pages.
 */
export async function searchEverything(
  query: string,
  { browse = false }: { browse?: boolean } = {}
): Promise<SearchResults> {
  const q = query.trim().slice(0, 80);
  const searching = q.length >= MIN_SEARCH_LENGTH;
  if (!searching && !browse) return { projects: [], candidates: [], companies: [] };

  const [projects, directory] = await Promise.all([
    getBrowseProjects(),
    searchDirectory(q, { browse }),
  ]);

  const matched = filterProjects(projects, { ...NO_FILTERS, q: searching ? q : "" });
  const openFirst = [...matched].sort(
    (a, b) => Number(b.availability === "open") - Number(a.availability === "open")
  );

  return {
    projects: openFirst,
    candidates: directory.filter((result) => result.kind === "candidate"),
    companies: directory.filter((result) => result.kind === "company"),
  };
}
