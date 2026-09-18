"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCompanyIdForUser, getProjectHeader } from "@/lib/data/company";
import {
  companyProfileSchema,
  createProjectSchema,
  deleteProjectSchema,
  projectVisibilitySchema,
  updateApplicationStatusSchema,
  withdrawProjectSchema,
} from "@/lib/validations";
import { DEFAULT_CURRENCY, PROFILE_MEDIA_BUCKET } from "@/lib/constants";
import type { ActionResponse } from "@/lib/types/actions";

/** Company forms post without JS, so errors surface via the query string. */
function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function toList(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Date.now().toString(36)}`;
}

export async function saveCompanyProfileAction(formData: FormData) {
  const user = await requireRole(["company", "admin"]);

  const validated = companyProfileSchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website"),
    description: formData.get("description"),
    industry: formData.get("industry"),
    companySize: formData.get("companySize"),
    location: formData.get("location"),
  });
  if (!validated.success) {
    redirectWithError("/company/profile", validated.error.errors[0].message);
  }

  const payload = {
    name: validated.data.name,
    website: validated.data.website || null,
    description: validated.data.description || null,
    industry: validated.data.industry || null,
    company_size: validated.data.companySize || null,
    location: validated.data.location || null,
  };

  const supabase = await createClient();
  const existingCompanyId = await getCompanyIdForUser(user.id);

  if (existingCompanyId) {
    const { error } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", existingCompanyId);
    if (error) redirectWithError("/company/profile", error.message);
  } else {
    // Creating the company and its first owner row must be atomic, and RLS
    // cannot express the first-member case; see create_company_with_owner.
    const { error } = await supabase.rpc("create_company_with_owner", {
      company_name: payload.name,
      company_website: payload.website,
      company_description: payload.description,
      company_industry: payload.industry,
      company_size: payload.company_size,
      company_location: payload.location,
    });
    if (error) {
      redirectWithError("/company/profile", error.message || "Could not create company");
    }
  }

  revalidatePath("/company/profile");
  redirect("/company/profile?saved=1");
}

export async function createProjectAction(formData: FormData) {
  const user = await requireRole(["company", "admin"]);
  const createPath = "/company/projects/create";

  const applicationDeadlineRaw = String(formData.get("applicationDeadline") || "");
  const projectDeadlineRaw = String(formData.get("projectDeadline") || "");
  const applicationDeadline = new Date(applicationDeadlineRaw);
  const projectDeadline = new Date(projectDeadlineRaw);

  if (
    Number.isNaN(applicationDeadline.valueOf()) ||
    Number.isNaN(projectDeadline.valueOf())
  ) {
    redirectWithError(
      createPath,
      "Please provide valid application and project deadlines"
    );
  }

  const validated = createProjectSchema.safeParse({
    title: formData.get("title"),
    workMode: formData.get("workMode") || "local",
    description: formData.get("description"),
    problemStatement: formData.get("problemStatement"),
    context: formData.get("context"),
    requirements: toList(formData.get("requirements")),
    deliverables: toList(formData.get("deliverables")),
    acceptanceCriteria: toList(formData.get("acceptanceCriteria")),
    evaluationCriteria: toList(formData.get("evaluationCriteria")),
    expectedHours: formData.get("expectedHours"),
    paymentAmount: formData.get("paymentAmount"),
    currency: DEFAULT_CURRENCY,
    maxApplicants: formData.get("maxApplicants"),
    purpose: formData.get("purpose") || "hire",
    // Build-only projects always have one candidate, whatever was typed.
    openings: formData.get("purpose") === "build" ? 1 : formData.get("openings") || 1,
    applicationDeadline: applicationDeadline.toISOString(),
    projectDeadline: projectDeadline.toISOString(),
  });
  if (!validated.success) {
    redirectWithError(createPath, validated.error.errors[0].message);
  }

  const companyId = await getCompanyIdForUser(user.id);
  if (!companyId) {
    redirectWithError(
      "/company/profile",
      "Create your company profile before posting a project"
    );
  }

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      company_id: companyId,
      slug: toSlug(validated.data.title),
      title: validated.data.title,
      description: validated.data.description,
      problem_statement: validated.data.problemStatement,
      context: validated.data.context,
      requirements: validated.data.requirements,
      deliverables: validated.data.deliverables,
      acceptance_criteria: validated.data.acceptanceCriteria,
      evaluation_criteria: validated.data.evaluationCriteria,
      work_mode: validated.data.workMode,
      expected_hours: validated.data.expectedHours,
      payment_amount: validated.data.paymentAmount,
      currency: validated.data.currency,
      application_deadline: validated.data.applicationDeadline,
      project_deadline: validated.data.projectDeadline,
      max_applicants: validated.data.maxApplicants ?? null,
      purpose: validated.data.purpose,
      openings: validated.data.openings,
      status: "applications_open",
    })
    .select("id")
    .single();

  if (error || !project) {
    redirectWithError(createPath, error?.message || "Could not create project");
  }

  const skills = toList(formData.get("skills"));
  if (skills.length) {
    await supabase.from("project_skills").insert(
      skills.map((skill) => ({
        project_id: project.id,
        skill_name: skill,
        is_required: true,
      }))
    );
  }

  revalidatePath("/company/projects");
  revalidatePath("/projects");
  redirect("/company/projects?created=1");
}

export async function updateApplicationStatusAction(formData: FormData) {
  const user = await requireRole(["company", "admin"]);

  const validated = updateApplicationStatusSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
    decisionNote: formData.get("decisionNote"),
  });
  if (!validated.success) {
    redirectWithError("/company/projects", validated.error.errors[0].message);
  }

  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("project_id, candidate_id")
    .eq("id", validated.data.applicationId)
    .maybeSingle();

  if (!application) {
    redirectWithError("/company/projects", "Application not found");
  }

  const projectPath = `/company/projects/${application.project_id}`;
  const header = await getProjectHeader(application.project_id);
  if (!header) redirectWithError("/company/projects", "Project not found");

  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== header.companyId) {
      redirectWithError("/company/projects", "You cannot review this application");
    }
  }

  // The applicant page posts here too and should come back to itself. Only a
  // path inside this project's applicant pages is honoured — never an arbitrary URL.
  const requested = String(formData.get("returnTo") || "").split("?")[0];
  const destination = requested.startsWith(`${projectPath}/applicants/`)
    ? requested
    : projectPath;

  // apply_application_decision (database) makes Selected and Rejected final,
  // allows one selection per project, and creates that selection atomically.
  const { error } = await supabase
    .from("applications")
    .update({
      status: validated.data.status,
      // A message only belongs with a final decision.
      ...(validated.data.status === "reviewing"
        ? {}
        : { decision_note: validated.data.decisionNote ?? null }),
    })
    .eq("id", validated.data.applicationId);

  if (error) {
    redirectWithError(
      destination,
      error.code === "P0001" ? error.message : "Couldn't update the application."
    );
  }

  revalidatePath(projectPath);
  revalidatePath(destination);
  redirect(`${destination}?updated=${encodeURIComponent(validated.data.status)}`);
}

/**
 * Records the logo the browser just uploaded to `profile-media/<uid>/logo`.
 * Storage policies confine the upload to the member's own folder; this checks
 * it landed, then points the company at it.
 */
export async function saveCompanyLogoAction(): Promise<ActionResponse> {
  const user = await requireRole(["company", "admin"]);
  const companyId = await getCompanyIdForUser(user.id);
  if (!companyId) return { error: "Save your company profile before adding a logo." };

  const supabase = await createClient();
  const bucket = supabase.storage.from(PROFILE_MEDIA_BUCKET);
  const { data: files } = await bucket.list(user.id, { search: "logo" });
  if (!files?.some((file) => file.name === "logo")) {
    return { error: "Upload didn't finish. Please try again." };
  }

  // Same path on every upload, so the version stamp is what busts caches.
  const url = `${bucket.getPublicUrl(`${user.id}/logo`).data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase
    .from("companies")
    .update({ logo_url: url })
    .eq("id", companyId);
  if (error) return { error: error.message };

  revalidatePath("/company/profile");
  return { success: true };
}

export async function removeCompanyLogoAction(): Promise<ActionResponse> {
  const user = await requireRole(["company", "admin"]);
  const companyId = await getCompanyIdForUser(user.id);
  if (!companyId) return { error: "No company profile yet." };

  const supabase = await createClient();
  await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove([`${user.id}/logo`]);
  const { error } = await supabase
    .from("companies")
    .update({ logo_url: null })
    .eq("id", companyId);
  if (error) return { error: error.message };

  revalidatePath("/company/profile");
  return { success: true };
}

/** Loads a project and confirms the caller's company owns it, or redirects. */
async function requireOwnedProject(projectId: string) {
  const user = await requireRole(["company", "admin"]);
  const header = await getProjectHeader(projectId);
  if (!header) redirectWithError("/company/projects", "Project not found");
  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== header.companyId) {
      redirectWithError("/company/projects", "You can't change this project");
    }
  }
  return header;
}

/**
 * Private hides the project from Browse and pauses applications; public brings
 * it back. Only before a candidate is selected (guard_project_status).
 */
export async function setProjectVisibilityAction(formData: FormData) {
  const parsed = projectVisibilitySchema.safeParse({
    projectId: formData.get("projectId"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success)
    redirectWithError("/company/projects", parsed.error.errors[0].message);

  const project = await requireOwnedProject(parsed.data.projectId);
  const path = `/company/projects/${project.id}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      status: parsed.data.visibility === "private" ? "draft" : "applications_open",
    })
    .eq("id", project.id);
  if (error) {
    redirectWithError(
      path,
      error.code === "P0001" ? error.message : "Couldn't update the project."
    );
  }

  revalidatePath(path);
  revalidatePath("/projects");
  redirect(`${path}?updated=${parsed.data.visibility}`);
}

/** Closes the project for good and tells every applicant why. */
export async function withdrawProjectAction(formData: FormData) {
  const parsed = withdrawProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success)
    redirectWithError("/company/projects", parsed.error.errors[0].message);

  const project = await requireOwnedProject(parsed.data.projectId);
  const path = `/company/projects/${project.id}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "cancelled", withdrawal_reason: parsed.data.reason ?? null })
    .eq("id", project.id);
  if (error) {
    redirectWithError(
      path,
      error.code === "P0001" ? error.message : "Couldn't withdraw the project."
    );
  }

  revalidatePath(path);
  revalidatePath("/company/projects");
  revalidatePath("/projects");
  redirect(`${path}?updated=withdrawn`);
}

/** Removes a project nobody has applied to (delete_project enforces that). */
export async function deleteProjectAction(formData: FormData) {
  const parsed = deleteProjectSchema.safeParse({ projectId: formData.get("projectId") });
  if (!parsed.success)
    redirectWithError("/company/projects", parsed.error.errors[0].message);

  const project = await requireOwnedProject(parsed.data.projectId);
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_project", {
    target_project_id: project.id,
  });
  if (error) {
    redirectWithError(
      `/company/projects/${project.id}`,
      error.code === "P0001" ? error.message : "Couldn't delete the project."
    );
  }

  revalidatePath("/company/projects");
  revalidatePath("/projects");
  redirect("/company/projects?deleted=1");
}
