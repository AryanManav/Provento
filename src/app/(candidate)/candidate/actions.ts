"use server";

import { revalidatePath } from "next/cache";
import { requireCandidate } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  candidateProfileUpdateSchema,
  candidateSkillSchema,
  candidateProjectSchema,
} from "@/lib/validations/candidate";

export type ActionResponse = {
  success?: boolean;
  error?: string;
};

/**
 * Updates the candidate's core profile details (headline, bio, education, links)
 */
export async function updateCandidateProfileAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();
  const supabase = await createClient();

  const rawData = {
    headline: formData.get("headline") as string,
    bio: formData.get("bio") as string,
    location: formData.get("location") as string,
    education: formData.get("education") as string,
    graduationYear: formData.get("graduationYear") as string,
    resumeUrl: formData.get("resumeUrl") as string,
    githubUrl: formData.get("githubUrl") as string,
    portfolioUrl: formData.get("portfolioUrl") as string,
    linkedinUrl: formData.get("linkedinUrl") as string,
    availability: (formData.get("availability") as string) || "immediate",
  };

  const validated = candidateProfileUpdateSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

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

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}

/**
 * Adds a new technical skill to the candidate's profile
 */
export async function addCandidateSkillAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();
  const supabase = await createClient();

  const rawData = {
    skillName: (formData.get("skillName") as string)?.trim(),
    skillLevel: formData.get("skillLevel") as "beginner" | "intermediate" | "advanced",
    yearsExperience: formData.get("yearsExperience") || 0,
  };

  const validated = candidateSkillSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  // Get candidate profile id
  const { data: profile, error: profError } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError || !profile) {
    return { error: "Candidate profile not found" };
  }

  const { error } = await supabase.from("candidate_skills").insert({
    candidate_id: profile.id,
    skill_name: validated.data.skillName,
    skill_level: validated.data.skillLevel,
    years_experience: validated.data.yearsExperience,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}

/**
 * Deletes a skill from the candidate's profile
 */
export async function deleteCandidateSkillAction(skillId: string): Promise<ActionResponse> {
  const user = await requireCandidate();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase
    .from("candidate_skills")
    .delete()
    .eq("id", skillId)
    .eq("candidate_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}

/**
 * Adds a portfolio/past project to the candidate's profile
 */
export async function addCandidateProjectAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireCandidate();
  const supabase = await createClient();

  const rawData = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    technologies: formData.get("technologies") as string,
    repositoryUrl: formData.get("repositoryUrl") as string,
    liveUrl: formData.get("liveUrl") as string,
  };

  const validated = candidateProjectSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const techArray = validated.data.technologies
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase.from("candidate_projects").insert({
    candidate_id: profile.id,
    title: validated.data.title,
    description: validated.data.description,
    technologies: techArray,
    repository_url: validated.data.repositoryUrl || null,
    live_url: validated.data.liveUrl || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}

/**
 * Deletes a portfolio project from the candidate's profile
 */
export async function deleteCandidateProjectAction(projectId: string): Promise<ActionResponse> {
  const user = await requireCandidate();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase
    .from("candidate_projects")
    .delete()
    .eq("id", projectId)
    .eq("candidate_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/dashboard");
  return { success: true };
}
