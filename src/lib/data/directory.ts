import { createClient } from "@/lib/supabase/server";
import type {
  CandidatePublicView,
  ConnectionView,
  FollowStats,
  ProfileSocial,
  SearchResult,
} from "@/lib/types/domain";
import type { ProjectCategory } from "@/lib/types/database.types";

/** Shortest query worth sending — search_directory ignores anything shorter. */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Companies and discoverable candidates matching `query` (name, headline,
 * industry, location, skills or stack). With `browse`, a short or empty query
 * lists instead — candidates by verified work, companies by open projects.
 * Runs through search_directory, which returns only public-safe fields.
 */
export async function searchDirectory(
  query: string,
  { browse = false }: { browse?: boolean } = {}
): Promise<SearchResult[]> {
  const term = query.trim().slice(0, 80);
  if (term.length < MIN_SEARCH_LENGTH && !browse) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("search_directory", {
    query: term.length < MIN_SEARCH_LENGTH ? "" : term,
  });
  return (data ?? []).map((row) => ({
    kind: row.kind === "company" ? "company" : "candidate",
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    location: row.location,
    skills: row.skills ?? [],
    verifiedCount: row.verified_count ?? 0,
    openProjects: row.open_projects ?? 0,
    companySize: row.company_size ?? null,
  }));
}

interface RawPublicProfile {
  id: string;
  /** Hidden from search: only the id comes back. */
  private?: boolean;
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
  activity_dates?: string[] | null;
  verified_work?: {
    project_id: string;
    title: string;
    company_id: string;
    company_name: string;
    category: ProjectCategory | null;
    expected_hours: number;
    stack: string[] | null;
    accepted_at: string;
  }[];
}

/**
 * A candidate's public profile; "private" when they've turned off "Show my
 * profile in search"; null when there's no such candidate. Contact details are
 * never included.
 */
export async function getCandidatePublicProfile(
  candidateId: string
): Promise<CandidatePublicView | "private" | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("candidate_public_profile", {
    target_candidate_id: candidateId,
  });
  const row = data as unknown as RawPublicProfile | null;
  if (!row) return null;
  if (row.private) return "private";

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
    activityDates: row.activity_dates ?? [],
    verifiedWork: (row.verified_work ?? []).map((work) => ({
      projectId: work.project_id,
      title: work.title,
      companyId: work.company_id,
      companyName: work.company_name,
      category: work.category ?? "other",
      expectedHours: work.expected_hours,
      stack: work.stack ?? [],
      acceptedAt: work.accepted_at,
    })),
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
            skills: [],
            verifiedCount: 0,
            openProjects: 0,
            companySize: null,
          },
        ]
      : [];
  });

  // Candidate names aren't readable directly; the public-profile function
  // returns them (and hides anyone who has turned discoverability off).
  const candidates = (
    await Promise.all(
      rows
        .filter((row) => row.candidate_id)
        .map(async (row) => getCandidatePublicProfile(row.candidate_id as string))
    )
  ).map((candidate) => (candidate === "private" ? null : candidate));

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
              skills: candidate.skills.map((skill) => skill.name),
              verifiedCount: candidate.verifiedProjects,
              openProjects: 0,
              companySize: null,
            },
          ]
        : []
    ),
  ];
}

/** Followers and following counts, and whether the viewer follows the profile. */
export async function getProfileSocial(target: {
  companyId?: string;
  candidateId?: string;
}): Promise<ProfileSocial> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("profile_social", {
    target_company_id: target.companyId ?? null,
    target_candidate_id: target.candidateId ?? null,
  });
  if (error) {
    // Before the social-graph migration: fall back to the older counts.
    const stats = await getFollowStats(target);
    return { followers: stats.followers, following: 0, viewerFollows: stats.following };
  }
  const row = data?.[0];
  return {
    followers: row?.followers ?? 0,
    following: row?.following ?? 0,
    viewerFollows: row?.viewer_follows ?? false,
  };
}

/** A profile's followers, or what a candidate follows — visible profiles only. */
export async function getProfileConnections(
  direction: "followers" | "following",
  target: { companyId?: string; candidateId?: string }
): Promise<ConnectionView[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("profile_connections", {
    direction,
    target_company_id: target.companyId ?? null,
    target_candidate_id: target.candidateId ?? null,
  });
  return (data ?? []).map((row) => ({
    kind: row.kind === "company" ? "company" : "candidate",
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    viewerFollows: row.viewer_follows,
    isViewer: row.is_viewer,
  }));
}
