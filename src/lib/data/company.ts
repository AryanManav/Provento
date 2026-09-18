import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/data/utils";
import { getOpenProjects } from "@/lib/data/project";
import {
  getCandidateProfileById,
  getCandidateProjects,
  getCandidateSkills,
  getCandidateVerifiedTrials,
} from "@/lib/data/candidate";
import { DEFAULT_CURRENCY, OPEN_PROJECT_STATUSES } from "@/lib/constants";
import type {
  ApplicantProfileView,
  ApplicantView,
  CompanyProjectResult,
  CompanyProjectView,
  CompanyPublicView,
  CompanyView,
} from "@/lib/types/domain";
import type {
  ApplicationStatus,
  ProjectOutcomeType,
  ProjectStatus,
} from "@/lib/types/database.types";

interface RawCompanyRow {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  logo_url: string | null;
  verified: boolean;
}

interface RawMembership {
  company_id: string;
  companies: RawCompanyRow | RawCompanyRow[] | null;
}

interface RawApplicant {
  id: string;
  status: ApplicationStatus;
  cover_message: string;
  relevant_experience: string | null;
  candidate_profiles:
    | {
        headline: string | null;
        users:
          | { full_name: string; email: string }
          | { full_name: string; email: string }[]
          | null;
      }
    | {
        headline: string | null;
        users:
          | { full_name: string; email: string }
          | { full_name: string; email: string }[]
          | null;
      }[]
    | null;
}

/** The company the user belongs to, or null if they have not created one yet. */
export async function getCompanyForUser(userId: string): Promise<CompanyView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_members")
    .select(
      "company_id, companies(id, name, website, description, industry, company_size, location, logo_url, verified)"
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const company = one((data as unknown as RawMembership | null)?.companies);
  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    website: company.website,
    description: company.description,
    industry: company.industry,
    companySize: company.company_size,
    location: company.location,
    logoUrl: company.logo_url,
    verified: company.verified,
  };
}

export async function getCompanyIdForUser(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return data?.company_id ?? null;
}

/** Applications the company hasn't acted on, per project id. */
async function awaitingReviewByProject(
  projectIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (projectIds.length === 0) return counts;

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("project_id")
    .in("project_id", projectIds)
    .eq("status", "submitted");

  for (const row of data ?? []) {
    counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
  }
  return counts;
}

export async function getCompanyProjects(
  companyId: string
): Promise<CompanyProjectView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(
      "id, slug, title, description, status, expected_hours, payment_amount, currency, application_deadline"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const awaiting = await awaitingReviewByProject(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status as ProjectStatus,
    expectedHours: row.expected_hours,
    paymentAmount: row.payment_amount,
    currency: row.currency || DEFAULT_CURRENCY,
    applicationDeadline: row.application_deadline,
    companyId,
    companyName: null,
    awaitingReview: awaiting.get(row.id) ?? 0,
  }));
}

interface RawSelectionResult {
  project_id: string;
  candidate_profiles:
    | { users: { full_name: string } | { full_name: string }[] | null }
    | { users: { full_name: string } | { full_name: string }[] | null }[]
    | null;
}

/**
 * For finished projects: the selected candidate and the recorded outcome, keyed
 * by project. Callers pass ids already scoped to the company.
 */
export async function getCompanyProjectResults(
  projectIds: string[]
): Promise<Map<string, CompanyProjectResult>> {
  const results = new Map<string, CompanyProjectResult>();
  if (projectIds.length === 0) return results;

  const supabase = await createClient();
  const [selections, outcomes] = await Promise.all([
    supabase
      .from("project_selections")
      .select("project_id, candidate_profiles(users(full_name))")
      .in("project_id", projectIds),
    supabase
      .from("project_outcomes")
      .select("project_id, outcome, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: true }),
  ]);

  for (const row of (selections.data ?? []) as unknown as RawSelectionResult[]) {
    const user = one(one(row.candidate_profiles)?.users);
    results.set(row.project_id, {
      candidateName: user?.full_name ?? null,
      outcome: null,
    });
  }
  // Oldest first, so the latest recorded outcome wins.
  for (const row of outcomes.data ?? []) {
    const current = results.get(row.project_id) ?? { candidateName: null, outcome: null };
    results.set(row.project_id, {
      ...current,
      outcome: row.outcome as ProjectOutcomeType,
    });
  }
  return results;
}

export async function getProjectApplicants(projectId: string): Promise<ApplicantView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, status, cover_message, relevant_experience, candidate_profiles(headline, users(full_name, email))"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as RawApplicant[];

  return rows.map((row) => {
    const candidate = one(row.candidate_profiles);
    const account = one(candidate?.users);
    return {
      id: row.id,
      status: row.status,
      coverMessage: row.cover_message,
      relevantExperience: row.relevant_experience,
      candidateName: account?.full_name ?? "Candidate",
      candidateHeadline: candidate?.headline ?? null,
      candidateEmail: account?.email ?? null,
    };
  });
}

/** Title + owning company for a project, used to authorize company screens. */
export async function getProjectHeader(
  projectId: string
): Promise<{ id: string; title: string; companyId: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title, company_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, title: data.title, companyId: data.company_id };
}

export interface CompanyDashboardStats {
  totalProjects: number;
  activeProjects: number;
  applicants: number;
  inProgress: number;
  hires: number;
  awaitingReview: number;
}

/** Projects that have a candidate working but are not yet evaluated. */
const IN_FLIGHT: readonly ProjectStatus[] = [
  "candidate_selected",
  "in_progress",
  "submitted",
  "under_review",
  "revision_requested",
];

export async function getCompanyDashboardStats(
  companyId: string
): Promise<CompanyDashboardStats> {
  const supabase = await createClient();

  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, status")
    .eq("company_id", companyId);

  const projects = (projectRows ?? []) as { id: string; status: ProjectStatus }[];
  const empty = {
    totalProjects: 0,
    activeProjects: 0,
    applicants: 0,
    inProgress: 0,
    hires: 0,
    awaitingReview: 0,
  };
  if (projects.length === 0) return empty;

  const ids = projects.map((project) => project.id);

  const [{ count: applicants }, { data: outcomeRows }, awaiting] = await Promise.all([
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .in("project_id", ids),
    supabase.from("project_outcomes").select("outcome").in("project_id", ids),
    awaitingReviewByProject(ids),
  ]);

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) =>
      (OPEN_PROJECT_STATUSES as readonly ProjectStatus[]).includes(project.status)
    ).length,
    applicants: applicants ?? 0,
    inProgress: projects.filter((project) => IN_FLIGHT.includes(project.status)).length,
    hires: (outcomeRows ?? []).filter((row) => row.outcome === "hire").length,
    awaitingReview: [...awaiting.values()].reduce((sum, count) => sum + count, 0),
  };
}

interface RawApplicationForReview {
  id: string;
  project_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  cover_message: string;
  relevant_experience: string | null;
  created_at: string;
}

/**
 * Everything a company needs to decide on one applicant. RLS only returns the
 * application to members of the company that owns the project; the page still
 * checks ownership explicitly before rendering.
 */
export async function getApplicantProfile(
  applicationId: string
): Promise<ApplicantProfileView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, project_id, candidate_id, status, cover_message, relevant_experience, created_at"
    )
    .eq("id", applicationId)
    .maybeSingle();

  const application = data as RawApplicationForReview | null;
  if (!application) return null;

  const profile = await getCandidateProfileById(application.candidate_id);
  if (!profile) return null;

  const [{ data: account }, skills, projects, verifiedTrials, { data: githubUsername }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, avatar_url")
        .eq("id", profile.userId)
        .maybeSingle(),
      getCandidateSkills(profile.id),
      getCandidateProjects(profile.id),
      getCandidateVerifiedTrials(profile.id),
      supabase.rpc("candidate_github_username", { target_candidate_id: profile.id }),
    ]);

  return {
    applicationId: application.id,
    projectId: application.project_id,
    status: application.status,
    coverMessage: application.cover_message,
    relevantExperience: application.relevant_experience,
    appliedAt: application.created_at,
    account: {
      id: profile.userId,
      fullName: account?.full_name ?? "Candidate",
      email: account?.email ?? "",
      avatarUrl: account?.avatar_url ?? null,
    },
    profile,
    skills,
    projects,
    verifiedTrials,
    githubUsername: githubUsername ?? null,
  };
}

/**
 * A company as candidates see it: the profile, an aggregate track record
 * (company_track_record returns counts only) and its open projects.
 */
export async function getCompanyPublicProfile(
  companyId: string
): Promise<CompanyPublicView | null> {
  const supabase = await createClient();
  const [{ data: company }, { data: record }, openProjects] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, description, website, industry, company_size, location, logo_url, verified, created_at"
      )
      .eq("id", companyId)
      .maybeSingle(),
    supabase.rpc("company_track_record", { target_company_id: companyId }),
    getOpenProjects(undefined, companyId),
  ]);
  if (!company) return null;

  // Before the migration runs the function is missing; show zeros, not an error.
  const counts = record?.[0];
  return {
    id: company.id,
    name: company.name,
    description: company.description,
    website: company.website,
    industry: company.industry,
    size: company.company_size,
    location: company.location,
    logoUrl: company.logo_url,
    verified: company.verified,
    memberSince: company.created_at,
    trackRecord: {
      openProjects: counts?.open_projects ?? openProjects.length,
      completedEvaluations: counts?.completed_evaluations ?? 0,
      hires: counts?.hires ?? 0,
      interviews: counts?.interviews ?? 0,
      cancelledProjects: counts?.cancelled_projects ?? 0,
    },
    openProjects,
  };
}
