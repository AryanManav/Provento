"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireCandidate, requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { recordActivity } from "@/lib/data/activity";
import { getCompanyIdForUser, getProjectHeader } from "@/lib/data/company";
import { isSelectedCandidate } from "@/lib/data/evaluation";
import {
  projectFeedbackSchema,
  projectMessageSchema,
  projectOutcomeSchema,
  reviewSubmissionSchema,
  submissionAttachmentsSchema,
  submitWorkSchema,
} from "@/lib/validations";
import { CANDIDATE_ACTIVITY_TYPES, SUBMITTABLE_WORK_STATUSES } from "@/lib/constants";
import type { SelectionWorkStatus } from "@/lib/types/database.types";
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

  // Only a selected candidate may submit, and only while their own work cycle
  // allows it. apply_project_submission enforces this; checking first gives a
  // clearer message.
  const { data: selection } = await supabase
    .from("project_selections")
    .select("status")
    .eq("project_id", validated.data.projectId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (!selection) return { error: "You weren't selected for this project" };
  if (
    !(SUBMITTABLE_WORK_STATUSES as readonly SelectionWorkStatus[]).includes(
      selection.status as SelectionWorkStatus
    )
  ) {
    return { error: "Your submission is with the startup — wait for their decision" };
  }

  // apply_project_submission moves this candidate's work to "submitted".
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

  if (error?.code === "P0001") return { error: error.message };
  if (error || !submission)
    return { error: "Couldn't submit your work. Please try again." };

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
    reviewNote: formData.get("reviewNote"),
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

  // apply_submission_decision (database) refuses a second decision and moves
  // the project on: accepted/rejected → completed, revision → reopened.
  const { error } = await supabase
    .from("project_submissions")
    .update({
      status: validated.data.decision,
      review_note: validated.data.reviewNote ?? null,
    })
    .eq("id", validated.data.submissionId);

  if (error?.code === "P0001") return { error: error.message };
  if (error) return { error: "Couldn't record the decision. Please try again." };

  revalidatePath(`/company/projects/${submission.project_id}`, "layout");
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
    candidateId: formData.get("candidateId"),
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

  const { candidateId } = validated.data;
  if (!(await isSelectedCandidate(validated.data.projectId, candidateId))) {
    return { error: "This candidate isn't selected on this project" };
  }

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

  if (error?.code === "23505") return { error: "This has already been recorded." };
  if (error) return { error: "Couldn't save. Please try again." };

  revalidatePath(`/company/projects/${validated.data.projectId}/review/${candidateId}`);
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
    candidateId: formData.get("candidateId"),
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

  const { candidateId } = validated.data;
  if (!(await isSelectedCandidate(validated.data.projectId, candidateId))) {
    return { error: "This candidate isn't selected on this project" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_outcomes").insert({
    project_id: validated.data.projectId,
    candidate_id: candidateId,
    outcome: validated.data.outcome,
    reason: validated.data.reason,
    hired_at: validated.data.outcome === "hire" ? new Date().toISOString() : null,
    notes: validated.data.notes,
  });

  if (error?.code === "23505") return { error: "This has already been recorded." };
  if (error) return { error: "Couldn't save. Please try again." };

  revalidatePath(`/company/projects/${validated.data.projectId}/review/${candidateId}`);
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
    candidateId: formData.get("candidateId") || undefined,
    body: formData.get("body"),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const { projectId, body } = validated.data;

  // A thread belongs to one selected candidate. Candidates write in their own;
  // a company names the candidate whose thread it's replying in.
  let candidateId: string;
  let authorRole: "candidate" | "company";
  if (user.role === "candidate") {
    const ownId = await getCandidateProfileId(user.id);
    if (!ownId || !(await isSelectedCandidate(projectId, ownId))) {
      return { error: "You can only message about projects you were selected for" };
    }
    candidateId = ownId;
    authorRole = "candidate";
  } else {
    const ownership = await assertProjectOwnership(user.id, user.role, projectId);
    if ("error" in ownership) return { error: ownership.error };
    if (
      !validated.data.candidateId ||
      !(await isSelectedCandidate(projectId, validated.data.candidateId))
    ) {
      return { error: "Choose a selected candidate to message" };
    }
    candidateId = validated.data.candidateId;
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
  revalidatePath(`/company/projects/${projectId}/review/${candidateId}`);
  return { success: true };
}
