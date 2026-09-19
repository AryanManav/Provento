import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/data/utils";
import type {
  AssessmentSubmissionView,
  CandidateAssessmentView,
  HiringAssessmentView,
} from "@/lib/types/domain";
import type {
  ApplicationStatus,
  AssessmentStatus,
  AssessmentType,
  JobType,
  ProjectStatus,
  WorkArrangement,
} from "@/lib/types/database.types";

/** The assessment columns every read of a hire posting selects. */
export const ASSESSMENT_COLUMNS =
  "assessment_title, assessment_type, assessment_description, assessment_requirements, assessment_technologies, deliverables, evaluation_criteria, expected_hours, project_deadline";

export interface RawAssessmentColumns {
  assessment_title?: string | null;
  assessment_type?: AssessmentType | null;
  assessment_description?: string | null;
  assessment_requirements?: string[] | null;
  assessment_technologies?: string[] | null;
  deliverables?: string[] | null;
  evaluation_criteria?: string[] | null;
  expected_hours?: number | null;
  project_deadline?: string | null;
}

/** A posting's assessment, or null when it has none (build, or an older role). */
export function toAssessment(row: RawAssessmentColumns): HiringAssessmentView | null {
  if (!row.assessment_title?.trim()) return null;
  return {
    title: row.assessment_title,
    type: row.assessment_type ?? null,
    description: row.assessment_description ?? "",
    requirements: row.assessment_requirements ?? [],
    technologies: row.assessment_technologies ?? [],
    deliverables: row.deliverables ?? [],
    evaluationCriteria: row.evaluation_criteria ?? [],
    expectedHours: row.expected_hours ?? 0,
    deadline: row.project_deadline ?? "",
  };
}

export interface RawSubmission {
  status: AssessmentStatus;
  repository_url: string | null;
  live_url: string | null;
  notes: string | null;
  completed_requirements: number[] | null;
  started_at: string;
  submitted_at: string | null;
}

export const SUBMISSION_COLUMNS =
  "status, repository_url, live_url, notes, completed_requirements, started_at, submitted_at";

export function toSubmission(
  row: RawSubmission | null | undefined
): AssessmentSubmissionView | null {
  if (!row) return null;
  return {
    status: row.status,
    repositoryUrl: row.repository_url,
    liveUrl: row.live_url,
    notes: row.notes,
    completedRequirements: row.completed_requirements ?? [],
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
  };
}

interface RawAssessmentProject extends RawAssessmentColumns {
  id: string;
  slug: string;
  title: string;
  status: ProjectStatus;
  company_id: string;
  openings: number;
  job_type: JobType | null;
  work_arrangement: WorkArrangement | null;
  opportunity_type: string;
  companies: { name: string | null } | { name: string | null }[] | null;
}

interface RawAssessmentApplication {
  id: string;
  status: ApplicationStatus;
  decision_note: string | null;
  created_at: string;
  assessment_submissions: RawSubmission | RawSubmission[] | null;
}

/**
 * The candidate's own assessment for a role: the brief, their application and
 * what they've saved or submitted. Null unless they applied and the role has
 * an assessment — RLS limits every read to their own rows.
 */
export async function getCandidateAssessment(
  candidateId: string,
  projectId: string
): Promise<CandidateAssessmentView | null> {
  const supabase = await createClient();
  const [{ data: project }, { data: application }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `id, slug, title, status, company_id, openings, job_type, work_arrangement, opportunity_type, ${ASSESSMENT_COLUMNS}, companies(name)`
      )
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("applications")
      .select(
        `id, status, decision_note, created_at, assessment_submissions(${SUBMISSION_COLUMNS})`
      )
      .eq("project_id", projectId)
      .eq("candidate_id", candidateId)
      .maybeSingle(),
  ]);
  if (!project || !application) return null;

  const row = project as unknown as RawAssessmentProject;
  const assessment = row.opportunity_type === "hire" ? toAssessment(row) : null;
  if (!assessment) return null;
  const app = application as unknown as RawAssessmentApplication;

  return {
    project: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      companyId: row.company_id,
      companyName: one(row.companies)?.name ?? null,
      openings: row.openings,
      jobType: row.job_type,
      workArrangement: row.work_arrangement,
    },
    application: {
      id: app.id,
      status: app.status,
      decisionNote: app.decision_note,
      createdAt: app.created_at,
    },
    assessment,
    submission: toSubmission(one(app.assessment_submissions)),
  };
}
