import type { UserRole } from "@/lib/types/database.types";

const RECENT_KEY = "trialent:recent-searches";
const RECENT_LIMIT = 5;

/** Starting points by role, shown before anything is typed. */
export const SEARCH_SUGGESTIONS: Record<UserRole, string[]> = {
  candidate: ["React", "Node.js", "Python", "Machine learning", "Mobile"],
  company: ["React", "TypeScript", "Python", "Data analysis", "DevOps"],
  admin: ["React", "Python"],
};

export function searchHref(query: string, type?: string): string {
  const params = new URLSearchParams({ q: query });
  if (type && type !== "all") params.set("type", type);
  return `/search?${params.toString()}`;
}

/** Recent searches live in this browser only; storage can be unavailable. */
export function readRecentSearches(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): string[] {
  const term = query.trim();
  const next = [
    term,
    ...readRecentSearches().filter((item) => item.toLowerCase() !== term.toLowerCase()),
  ].slice(0, RECENT_LIMIT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Not remembered; the search still runs.
  }
  return next;
}

export function clearRecentSearches(): string[] {
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // Nothing to clear.
  }
  return [];
}
