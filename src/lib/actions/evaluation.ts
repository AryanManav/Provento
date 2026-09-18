"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireCandidate, requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { recordActivity } from "@/lib/data/activity";
import { getCompanyIdForUser, getProjectHeader } from "@/lib/data/company";
import { getSelectedCandidateId } from "@/lib/data/evaluation";
import {
  projectFeedbackSchema,
  projectMessageSchema,
  projectOutcomeSchema,
  reviewSubmissionSchema,
  submissionAttachmentsSchema,
  submitWorkSchema,
} from "@/lib/validations";
import { CANDIDATE_ACTIVITY_TYPES, SUBMITTABLE_PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types/database.types";
import type { ActionResponse } from "@/lib/types/actions";

/**
 * Company screens are the only ones allowed to act on a project, so every
 * company action re-derives ownership rather than trusting the route param.
 */
async function assertProjectOwnership(
  userId: string,
  role: string,
  projectId: string
): Promise<{ companyId: string } | { error: string }> {
  const header = await getProjectHeader(projectId);
  if (!header) return { error: "Project not found" };

  if (role === "admin") return { companyId: header.companyId };

  const companyId = await getCompanyIdForUser(userId);
  if (companyId !== header.companyId) {
    return { error: "You cannot evaluate this project" };
  }
  return { companyId: header.companyId };
}

export async function submitProjectWorkAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = submitWorkSchema.safeParse({
    projectId: formData.get("projectId"),
    repositoryUrl: (formData.get("repositoryUrl") as string)?.trim(),
    deploymentUrl: (formData.get("deploymentUrl") as string)?.trim(),
    submissionNotes: (formData.get("submissionNotes") as string)?.trim(),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  let rawAttachments: unknown = [];
  try {
    rawAttachments = JSON.parse(String(formData.get("attachments") || "[]"));
  } catch {
    return { error: "The attached files couldn't be read. Please re-attach them." };
  }
  const attachments = submissionAttachmentsSchema.safeParse(rawAttachments);
  if (!attachments.success) return { error: attachments.error.errors[0].message };

  // Files must sit in this candidate's own folder for this project. Storage and
  // table policies enforce the same prefix; this gives a clear error first.
  const prefix = `${validated.data.projectId}/${user.id}/`;
  if (attachments.data.some((file) => !file.path.startsWith(prefix))) {
    return { error: "An attached file doesn't belong to this project." };
  }

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();

  // Only the selected candidate may submit, and only while the project is open
  // for work. RLS enforces the first; this also gives a usable error message.
  const { data: project } = await supabase
    .from("projects")
    .select("status")
    .eq("id", validated.data.projectId)
    .maybeSingle();

  if (!project) return { error: "Project not found" };
  if (
    !(SUBMITTABLE_PROJECT_STATUSES as readonly ProjectStatus[]).includes(project.status)
  ) {
    return { error: "This project is not currently accepting submissions" };
  }

  // The apply_project_submission trigger moves the project to "submitted";
  // candidates cannot update projects directly.
  const { data: submission, error } = await supabase
    .from("project_submissions")
    .insert({
      project_id: validated.data.projectId,
      candidate_id: candidateId,
      repository_url: validated.data.repositoryUrl,
      deployment_url: validated.data.deploymentUrl || null,
      submission_notes: validated.data.submissionNotes,
    })
    .select("id")
    .single();

  if (error || !submission) return { error: error?.message ?? "Could not submit" };

  if (attachments.data.length > 0) {
    const { error: attachError } = await supabase.from("submission_attachments").insert(
      attachments.data.map((file) => ({
        submission_id: submission.id,
        storage_path: file.path,
        file_name: file.name,
        size_bytes: file.size,
        content_type: file.type ?? null,
      }))
    );
    if (attachError) {
      return { error: "Your work was submitted, but the files couldn't be attached." };
    }
  }

  await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.workSubmitted);

  revalidatePath(`/candidate/trials/${validated.data.projectId}`);
  revalidatePath("/candidate/trials");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}

export async function reviewSubmissionAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole(["company", "admin"]);

  const validated = reviewSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("project_submissions")
    .select("project_id")
    .eq("id", validated.data.submissionId)
    .maybeSingle();

  if (!submission) return { error: "Submission not found" };

  const ownership = await assertProjectOwnership(
    user.id,
    user.role,
    submission.project_id
  );
  if ("error" in ownership) return { error: ownership.error };

  const { error } = await supabase
    .from("project_submissions")
    .update({ status: validated.data.decision })
    .eq("id", validated.data.submissionId);

  if (error) return { error: error.message };

  // Accepting closes the work phase; a revision request reopens it.
  const nextProjectStatus: ProjectStatus =
    validated.data.decision === "accepted"
      ? "completed"
      : validated.data.decision === "revision_requested"
        ? "revision_requested"
        : "under_review";

  await supabase
    .from("projects")
    .update({ status: nextProjectStatus })
    .eq("id", submission.project_id);

  revalidatePath(`/company/projects/${submission.project_id}/review`);
  revalidatePath(`/candidate/trials/${submission.project_id}`);
  return { success: true };
}

export async function recordProjectFeedbackAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole(["company", "admin"]);

  const validated = projectFeedbackSchema.safeParse({
    projectId: formData.get("projectId"),
    requirementsCompleted: formData.get("requirementsCompleted") === "on",
    technicalQuality: formData.get("technicalQuality"),
    completeness: formData.get("completeness"),
    testingQuality: formData.get("testingQuality"),
    documentationQuality: formData.get("documentationQuality"),
    deadlineMet: formData.get("deadlineMet") === "on",
    revisionsRequired: formData.get("revisionsRequired") || 0,
    writtenFeedback: (formData.get("writtenFeedback") as string)?.trim(),
    whatWasMissing: (formData.get("whatWasMissing") as string)?.trim() || null,
    wouldInterviewOrHire: formData.get("wouldInterviewOrHire"),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const ownership = await assertProjectOwnership(
    user.id,
    user.role,
    validated.data.projectId
  );
  if ("error" in ownership) return { error: ownership.error };

  const candidateId = await getSelectedCandidateId(validated.data.projectId);
  if (!candidateId) return { error: "No candidate has been selected for this project" };

  const supabase = await createClient();
  const { error } = await supabase.from("project_feedback").insert({
    project_id: validated.data.projectId,
    candidate_id: candidateId,
    company_id: ownership.companyId,
    reviewer_id: user.id,
    requirements_completed: validated.data.requirementsCompleted,
    technical_quality: validated.data.technicalQuality,
    completeness: validated.data.completeness,
    testing_quality: validated.data.testingQuality,
    documentation_quality: validated.data.documentationQuality,
    deadline_met: validated.data.deadlineMet,
    revisions_required: validated.data.revisionsRequired,
    written_feedback: validated.data.writtenFeedback,
    what_was_missing: validated.data.whatWasMissing,
    would_interview_or_hire: validated.data.wouldInterviewOrHire,
  });

  if (error) return { error: error.message };

  revalidatePath(`/company/projects/${validated.data.projectId}/review`);
  revalidatePath("/candidate/profile");
  return { success: true };
}

export async function recordProjectOutcomeAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireRole(["company", "admin"]);

  const validated = projectOutcomeSchema.safeParse({
    projectId: formData.get("projectId"),
    outcome: formData.get("outcome"),
    reason: (formData.get("reason") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const ownership = await assertProjectOwnership(
    user.id,
    user.role,
    validated.data.projectId
  );
  if ("error" in ownership) return { error: ownership.error };

  const candidateId = await getSelectedCandidateId(validated.data.projectId);
  if (!candidateId) return { error: "No candidate has been selected for this project" };

  const supabase = await createClient();
  const { error } = await supabase.from("project_outcomes").insert({
    project_id: validated.data.projectId,
    candidate_id: candidateId,
    outcome: validated.data.outcome,
    reason: validated.data.reason,
    hired_at: validated.data.outcome === "hire" ? new Date().toISOString() : null,
    notes: validated.data.notes,
  });

  if (error) return { error: error.message };

  revalidatePath(`/company/projects/${validated.data.projectId}/review`);
  revalidatePath("/candidate/profile");
  return { success: true };
}

/**
 * Either side of a project's clarification thread. The thread belongs to the
 * selected candidate, so a company posts into that candidate's thread and a
 * candidate only ever into their own.
 */
export async function postProjectMessageAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again" };

  const validated = projectMessageSchema.safeParse({
    projectId: formData.get("projectId"),
    body: formData.get("body"),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const { projectId, body } = validated.data;
  const candidateId = await getSelectedCandidateId(projectId);
  if (!candidateId) return { error: "No candidate has been selected for this project" };

  let authorRole: "candidate" | "company";
  if (user.role === "candidate") {
    if ((await getCandidateProfileId(user.id)) !== candidateId) {
      return { error: "You can only message about projects you were selected for" };
    }
    authorRole = "candidate";
  } else {
    const ownership = await assertProjectOwnership(user.id, user.role, projectId);
    if ("error" in ownership) return { error: ownership.error };
    authorRole = "company";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_messages").insert({
    project_id: projectId,
    candidate_id: candidateId,
    author_id: user.id,
    author_role: authorRole,
    body,
  });
  if (error) return { error: error.message };

  revalidatePath(`/candidate/trials/${projectId}`);
  revalidatePath(`/company/projects/${projectId}/review`);
  return { success: true };
}
