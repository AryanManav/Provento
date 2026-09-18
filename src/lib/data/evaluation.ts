import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/data/utils";
import { getSubmissions } from "@/lib/data/trial";
import type { EvaluationView, FeedbackView, OutcomeView } from "@/lib/types/domain";
import type { ProjectOutcomeType, ProjectStatus } from "@/lib/types/database.types";

interface RawProject {
  id: string;
  title: string;
  company_id: string;
  status: ProjectStatus;
  evaluation_criteria: string[];
  acceptance_criteria: string[];
  project_deadline: string;
}

interface RawSelectedCandidate {
  candidate_id: string;
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

interface RawFeedbackRow {
  id: string;
  requirements_completed: boolean;
  technical_quality: string;
  completeness: string;
  testing_quality: string;
  documentation_quality: string;
  deadline_met: boolean;
  revisions_required: number;
  written_feedback: string;
  what_was_missing: string | null;
  would_interview_or_hire: string;
  created_at: string;
}

interface RawOutcomeRow {
  id: string;
  outcome: ProjectOutcomeType;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

function toFeedback(row: RawFeedbackRow): FeedbackView {
  return {
    id: row.id,
    requirementsCompleted: row.requirements_completed,
    technicalQuality: row.technical_quality,
    completeness: row.completeness,
    testingQuality: row.testing_quality,
    documentationQuality: row.documentation_quality,
    deadlineMet: row.deadline_met,
    revisionsRequired: row.revisions_required,
    writtenFeedback: row.written_feedback,
    whatWasMissing: row.what_was_missing,
    wouldInterviewOrHire: row.would_interview_or_hire,
    createdAt: row.created_at,
  };
}

function toOutcome(row: RawOutcomeRow): OutcomeView {
  return {
    id: row.id,
    outcome: row.outcome,
    reason: row.reason,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** The selected candidate for a project, or null if none has been chosen. */
export async function getSelectedCandidateId(projectId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_selections")
    .select("candidate_id")
    .eq("project_id", projectId)
    .maybeSingle();

  return data?.candidate_id ?? null;
}

/** Everything the company evaluation screen renders, in one call. */
export async function getEvaluation(projectId: string): Promise<EvaluationView | null> {
  const supabase = await createClient();

  const { data: projectRow } = await supabase
    .from("projects")
    .select(
      "id, title, company_id, status, evaluation_criteria, acceptance_criteria, project_deadline"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!projectRow) return null;
  const project = projectRow as unknown as RawProject;

  const { data: selectionRow } = await supabase
    .from("project_selections")
    .select("candidate_id, candidate_profiles(headline, users(full_name, email))")
    .eq("project_id", projectId)
    .maybeSingle();

  const selection = selectionRow as unknown as RawSelectedCandidate | null;
  const profile = one(selection?.candidate_profiles);
  const account = one(profile?.users);

  const candidate = selection
    ? {
        id: selection.candidate_id,
        name: account?.full_name ?? "Candidate",
        email: account?.email ?? null,
        headline: profile?.headline ?? null,
      }
    : null;

  const submissions = candidate ? await getSubmissions(projectId, candidate.id) : [];

  const [{ data: feedbackRow }, { data: outcomeRow }] = await Promise.all([
    supabase
      .from("project_feedback")
      .select(
        "id, requirements_completed, technical_quality, completeness, testing_quality, documentation_quality, deadline_met, revisions_required, written_feedback, what_was_missing, would_interview_or_hire, created_at"
      )
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("project_outcomes")
      .select("id, outcome, reason, notes, created_at")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  return {
    projectId: project.id,
    title: project.title,
    companyId: project.company_id,
    status: project.status,
    evaluationCriteria: project.evaluation_criteria ?? [],
    acceptanceCriteria: project.acceptance_criteria ?? [],
    projectDeadline: project.project_deadline,
    candidate,
    submissions,
    feedback: feedbackRow ? toFeedback(feedbackRow as unknown as RawFeedbackRow) : null,
    outcome: outcomeRow ? toOutcome(outcomeRow as unknown as RawOutcomeRow) : null,
  };
}
