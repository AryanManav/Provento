"use server";

import { revalidatePath } from "next/cache";
import { requireCandidate } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { isProjectOpen } from "@/lib/data/project";
import {
  candidateProfileSchema,
  candidateProjectSchema,
  candidateProjectUpdateSchema,
  candidateSkillSchema,
  candidateSkillUpdateSchema,
  createApplicationSchema,
  profileMediaKindSchema,
  withdrawApplicationSchema,
} from "@/lib/validations";
import { CANDIDATE_ACTIVITY_TYPES, PROFILE_MEDIA_BUCKET } from "@/lib/constants";
import { recordActivity } from "@/lib/data/activity";
import type { ActionResponse } from "@/lib/types/actions";

const PROFILE_PATHS = ["/candidate/profile", "/candidate/dashboard"];

function revalidate(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

function toTechnologyList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateCandidateProfileAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = candidateProfileSchema.safeParse({
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    education: formData.get("education"),
    graduationYear: formData.get("graduationYear"),
    resumeUrl: formData.get("resumeUrl"),
    githubUrl: formData.get("githubUrl"),
    portfolioUrl: formData.get("portfolioUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    availability: (formData.get("availability") as string) || "immediate",
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_profiles")
    .update({
      headline: validated.data.headline || null,
      bio: validated.data.bio || null,
      location: validated.data.location || null,
      education: validated.data.education || null,
      graduation_year: validated.data.graduationYear || null,
      resume_url: validated.data.resumeUrl || null,
      github_url: validated.data.githubUrl || null,
      portfolio_url: validated.data.portfolioUrl || null,
      linkedin_url: validated.data.linkedinUrl || null,
      availability: validated.data.availability,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  const candidateId = await getCandidateProfileId(user.id);
  if (candidateId) {
    await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.profileUpdated);
  }

  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function addCandidateSkillAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = candidateSkillSchema.safeParse({
    skillName: (formData.get("skillName") as string)?.trim(),
    skillLevel: formData.get("skillLevel"),
    yearsExperience: formData.get("yearsExperience") || 0,
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();
  const { error } = await supabase.from("candidate_skills").insert({
    candidate_id: candidateId,
    skill_name: validated.data.skillName,
    skill_level: validated.data.skillLevel,
    years_experience: validated.data.yearsExperience,
  });

  if (error) return { error: error.message };

  await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.skillAdded);
  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function updateCandidateSkillAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = candidateSkillUpdateSchema.safeParse({
    skillId: formData.get("skillId"),
    skillName: (formData.get("skillName") as string)?.trim(),
    skillLevel: formData.get("skillLevel"),
    yearsExperience: formData.get("yearsExperience") || 0,
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_skills")
    .update({
      skill_name: validated.data.skillName,
      skill_level: validated.data.skillLevel,
      years_experience: validated.data.yearsExperience,
    })
    .eq("id", validated.data.skillId)
    .eq("candidate_id", candidateId);

  if (error) return { error: error.message };

  await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.skillAdded);
  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function deleteCandidateSkillAction(
  skillId: string
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_skills")
    .delete()
    .eq("id", skillId)
    .eq("candidate_id", candidateId);

  if (error) return { error: error.message };

  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function addCandidateProjectAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = candidateProjectSchema.safeParse({
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    technologies: formData.get("technologies"),
    repositoryUrl: formData.get("repositoryUrl"),
    liveUrl: formData.get("liveUrl"),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();
  const { error } = await supabase.from("candidate_projects").insert({
    candidate_id: candidateId,
    title: validated.data.title,
    description: validated.data.description,
    technologies: toTechnologyList(validated.data.technologies),
    repository_url: validated.data.repositoryUrl || null,
    live_url: validated.data.liveUrl || null,
  });

  if (error) return { error: error.message };

  await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.portfolioUpdated);
  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function updateCandidateProjectAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = candidateProjectUpdateSchema.safeParse({
    projectId: formData.get("projectId"),
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    technologies: formData.get("technologies"),
    repositoryUrl: formData.get("repositoryUrl"),
    liveUrl: formData.get("liveUrl"),
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_projects")
    .update({
      title: validated.data.title,
      description: validated.data.description,
      technologies: toTechnologyList(validated.data.technologies),
      repository_url: validated.data.repositoryUrl || null,
      live_url: validated.data.liveUrl || null,
    })
    .eq("id", validated.data.projectId)
    .eq("candidate_id", candidateId);

  if (error) return { error: error.message };

  await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.portfolioUpdated);
  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function deleteCandidateProjectAction(
  projectId: string
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_projects")
    .delete()
    .eq("id", projectId)
    .eq("candidate_id", candidateId);

  if (error) return { error: error.message };

  revalidate(PROFILE_PATHS);
  return { success: true };
}

export async function createApplicationAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();

  const validated = createApplicationSchema.safeParse({
    projectId: formData.get("projectId"),
    coverMessage: (formData.get("coverMessage") as string)?.trim(),
    relevantExperience: (formData.get("relevantExperience") as string)?.trim() || null,
  });
  if (!validated.success) return { error: validated.error.errors[0].message };

  const candidateId = await getCandidateProfileId(user.id);
  if (!candidateId) return { error: "Candidate profile not found" };

  if (!(await isProjectOpen(validated.data.projectId))) {
    return { error: "This project is no longer accepting applications" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({
    project_id: validated.data.projectId,
    candidate_id: candidateId,
    cover_message: validated.data.coverMessage,
    relevant_experience: validated.data.relevantExperience,
  });

  if (error?.code === "23505") {
    return { error: "You have already applied to this project" };
  }
  // enforce_application_window: closed, past the deadline, or full.
  if (error?.code === "P0001") return { error: error.message };
  if (error) return { error: "Couldn't submit your application. Please try again." };

  await recordActivity(
    supabase,
    candidateId,
    CANDIDATE_ACTIVITY_TYPES.applicationSubmitted
  );
  revalidate(["/candidate/applications", "/candidate/dashboard", "/projects"]);
  return { success: true };
}

/**
 * Called after the browser has uploaded to `<user id>/<kind>` in storage. The
 * path is derived from the session here, never taken from the client, so a
 * caller cannot point their profile at another user's file.
 */
export async function saveProfileImageAction(kind: unknown): Promise<ActionResponse> {
  const user = await requireCandidate();
  const parsed = profileMediaKindSchema.safeParse(kind);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const bucket = supabase.storage.from(PROFILE_MEDIA_BUCKET);

  const { data: files } = await bucket.list(user.id, { search: parsed.data });
  if (!files?.some((file) => file.name === parsed.data)) {
    return { error: "Upload didn't finish. Please try again." };
  }

  // Same path on every upload, so the version stamp is what busts caches.
  const url = `${bucket.getPublicUrl(`${user.id}/${parsed.data}`).data.publicUrl}?v=${Date.now()}`;

  const { error } =
    parsed.data === "avatar"
      ? await supabase.from("users").update({ avatar_url: url }).eq("id", user.id)
      : await supabase
          .from("candidate_profiles")
          .update({ banner_url: url })
          .eq("user_id", user.id);

  if (error) return { error: error.message };

  const candidateId = await getCandidateProfileId(user.id);
  if (candidateId) {
    await recordActivity(supabase, candidateId, CANDIDATE_ACTIVITY_TYPES.profileUpdated);
  }

  revalidatePath("/candidate", "layout");
  return { success: true };
}

export async function removeProfileImageAction(kind: unknown): Promise<ActionResponse> {
  const user = await requireCandidate();
  const parsed = profileMediaKindSchema.safeParse(kind);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove([`${user.id}/${parsed.data}`]);

  const { error } =
    parsed.data === "avatar"
      ? await supabase.from("users").update({ avatar_url: null }).eq("id", user.id)
      : await supabase
          .from("candidate_profiles")
          .update({ banner_url: null })
          .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/candidate", "layout");
  return { success: true };
}

/** Allowed only before selection; the database function enforces the same rule. */
export async function withdrawApplicationAction(
  applicationId: unknown
): Promise<ActionResponse> {
  await requireCandidate();
  const parsed = withdrawApplicationSchema.safeParse({ applicationId });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_application", {
    target_application_id: parsed.data.applicationId,
  });
  if (error) return { error: error.message };

  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}
