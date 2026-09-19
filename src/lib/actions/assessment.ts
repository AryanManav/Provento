"use server";

import { revalidatePath } from "next/cache";
import { requireCandidate } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { recordActivity } from "@/lib/data/activity";
import { saveAssessmentSchema } from "@/lib/validations";
import { CANDIDATE_ACTIVITY_TYPES } from "@/lib/constants";
import type { ActionResponse } from "@/lib/types/actions";

/**
 * Save progress on, or submit, a hiring assessment. `save_assessment` checks
 * the application, the posting's state and the deadline, and refuses changes
 * once submitted — this only shapes the input and reports its answer.
 */
export async function saveAssessmentAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const parsed = saveAssessmentSchema.safeParse({
    projectId: formData.get("projectId"),
    repositoryUrl: String(formData.get("repositoryUrl") ?? ""),
    liveUrl: String(formData.get("liveUrl") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    completedRequirements: formData.getAll("completed"),
    submit: formData.get("intent") === "submit",
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_assessment", {
    target_project_id: input.projectId,
    repository: input.repositoryUrl,
    live: input.liveUrl,
    note: input.notes,
    done: input.completedRequirements,
    submit: input.submit,
  });
  if (error) {
    return {
      error:
        error.code === "P0001"
          ? error.message
          : "Couldn't save your assessment. Please try again.",
    };
  }

  if (input.submit) {
    const candidateId = await getCandidateProfileId(user.id);
    if (candidateId) {
      await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.workSubmitted);
    }
  }

  revalidatePath(`/candidate/assessments/${input.projectId}`);
  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}
