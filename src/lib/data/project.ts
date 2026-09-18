import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/data/utils";
import { DEFAULT_CURRENCY, OPEN_PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectDetailView, ProjectSummaryView } from "@/lib/types/domain";
import type { ProjectStatus, ProjectWorkMode } from "@/lib/types/database.types";

const SUMMARY_COLUMNS =
  "id, slug, title, description, status, expected_hours, payment_amount, currency, application_deadline, companies(name)";

interface RawProjectSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  expected_hours: number;
  payment_amount: number;
  currency: string;
  application_deadline: string;
  companies: { name: string | null } | { name: string | null }[] | null;
}

function toSummary(row: RawProjectSummary): ProjectSummaryView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    expectedHours: row.expected_hours,
    paymentAmount: row.payment_amount,
    currency: row.currency || DEFAULT_CURRENCY,
    applicationDeadline: row.application_deadline,
    companyName: one(row.companies)?.name ?? null,
  };
}

/** Projects visible in the public directory and candidate recommendations. */
export async function getOpenProjects(limit?: number): Promise<ProjectSummaryView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .in("status", [...OPEN_PROJECT_STATUSES])
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return ((data ?? []) as unknown as RawProjectSummary[]).map(toSummary);
}

interface RawProjectDetail extends RawProjectSummary {
  work_mode: ProjectWorkMode;
  problem_statement: string;
  context: string;
  requirements: string[];
  deliverables: string[];
  acceptance_criteria: string[];
  evaluation_criteria: string[];
  project_deadline: string;
  companies:
    | { name: string | null; location?: string | null }
    | { name: string | null; location?: string | null }[]
    | null;
  project_skills: { skill_name: string; is_required: boolean }[] | null;
}

/** Full public project page, restricted to projects that are open for applications. */
export async function getOpenProjectBySlug(
  slug: string
): Promise<ProjectDetailView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(
      "id, slug, title, description, status, expected_hours, payment_amount, currency, application_deadline, project_deadline, work_mode, problem_statement, context, requirements, deliverables, acceptance_criteria, evaluation_criteria, companies(name, location), project_skills(skill_name, is_required)"
    )
    .eq("slug", slug)
    .in("status", [...OPEN_PROJECT_STATUSES])
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as RawProjectDetail;
  const company = one(row.companies);

  return {
    ...toSummary(row),
    workMode: row.work_mode ?? "local",
    companyLocation: company?.location ?? null,
    problemStatement: row.problem_statement,
    context: row.context,
    requirements: row.requirements ?? [],
    deliverables: row.deliverables ?? [],
    acceptanceCriteria: row.acceptance_criteria ?? [],
    evaluationCriteria: row.evaluation_criteria ?? [],
    projectDeadline: row.project_deadline,
    skills: (row.project_skills ?? []).map((skill) => ({
      name: skill.skill_name,
      required: skill.is_required,
    })),
  };
}

export async function getProjectIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return data?.id ?? null;
}

/** True when the project still accepts applications. */
export async function isProjectOpen(projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();

  if (!data) return false;
  return (OPEN_PROJECT_STATUSES as readonly ProjectStatus[]).includes(data.status);
}
