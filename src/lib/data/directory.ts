import { createClient } from "@/lib/supabase/server";
import type { CandidatePublicView, FollowStats, SearchResult } from "@/lib/types/domain";

/** Shortest query worth sending — search_directory ignores anything shorter. */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Companies and discoverable candidates matching `query` (name, headline,
 * industry, skills or stack). Runs through search_directory, which returns only
 * public-safe fields.
 */
export async function searchDirectory(query: string): Promise<SearchResult[]> {
  const term = query.trim().slice(0, 80);
  if (term.length < MIN_SEARCH_LENGTH) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("search_directory", { query: term });
  return (data ?? []).map((row) => ({
    kind: row.kind === "company" ? "company" : "candidate",
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    location: row.location,
  }));
}

interface RawPublicProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  education: string | null;
  graduation_year: number | null;
  github_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  is_self: boolean;
  skills: { name: string; level: string | null }[];
  projects: {
    title: string;
    description: string;
    technologies: string[] | null;
    repository_url: string | null;
    live_url: string | null;
  }[];
  verified_projects: number;
}

/**
 * A candidate's public profile, or null when they've turned off "Show my
 * profile in search" (or don't exist). Contact details are never included.
 */
export async function getCandidatePublicProfile(
  candidateId: string
): Promise<CandidatePublicView | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("candidate_public_profile", {
    target_candidate_id: candidateId,
  });
  const row = data as unknown as RawPublicProfile | null;
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    bannerUrl: row.banner_url,
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    education: row.education,
    graduationYear: row.graduation_year,
    githubUrl: row.github_url,
    portfolioUrl: row.portfolio_url,
    linkedinUrl: row.linkedin_url,
    isSelf: row.is_self,
    skills: row.skills ?? [],
    projects: (row.projects ?? []).map((project) => ({
      title: project.title,
      description: project.description,
      technologies: project.technologies ?? [],
      repositoryUrl: project.repository_url,
      liveUrl: project.live_url,
    })),
    verifiedProjects: row.verified_projects ?? 0,
  };
}

/** Follower count for a company or candidate, and whether the viewer follows. */
export async function getFollowStats(target: {
  companyId?: string;
  candidateId?: string;
}): Promise<FollowStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("follow_stats", {
    target_company_id: target.companyId ?? null,
    target_candidate_id: target.candidateId ?? null,
  });
  const row = data?.[0];
  return { followers: row?.followers ?? 0, following: row?.following ?? false };
}

interface RawFollow {
  company_id: string | null;
  candidate_id: string | null;
  companies:
    | {
        id: string;
        name: string;
        industry: string | null;
        logo_url: string | null;
        location: string | null;
      }
    | {
        id: string;
        name: string;
        industry: string | null;
        logo_url: string | null;
        location: string | null;
      }[]
    | null;
}

/** Everyone the viewer follows, companies first. */
export async function getFollowing(userId: string): Promise<SearchResult[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("company_id, candidate_id, companies(id, name, industry, logo_url, location)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as RawFollow[];
  const companies: SearchResult[] = rows.flatMap((row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    return company
      ? [
          {
            kind: "company" as const,
            id: company.id,
            title: company.name,
            subtitle: company.industry,
            imageUrl: company.logo_url,
            location: company.location,
          },
        ]
      : [];
  });

  // Candidate names aren't readable directly; the public-profile function
  // returns them (and hides anyone who has turned discoverability off).
  const candidates = await Promise.all(
    rows
      .filter((row) => row.candidate_id)
      .map(async (row) => getCandidatePublicProfile(row.candidate_id as string))
  );

  return [
    ...companies,
    ...candidates.flatMap((candidate) =>
      candidate
        ? [
            {
              kind: "candidate" as const,
              id: candidate.id,
              title: candidate.fullName,
              subtitle: candidate.headline,
              imageUrl: candidate.avatarUrl,
              location: candidate.location,
            },
          ]
        : []
    ),
  ];
}
