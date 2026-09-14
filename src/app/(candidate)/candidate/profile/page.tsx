import { requireCandidate } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProfileIntroCard } from "@/components/candidate/profile-intro-card";
import { ProfileAboutCard } from "@/components/candidate/profile-about-card";
import { SkillsCard } from "@/components/candidate/skills-card";
import { FeaturedProjectsCard } from "@/components/candidate/featured-projects-card";
import { VerifiedHistoryCard } from "@/components/candidate/verified-history-card";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const user = await requireCandidate();
  const supabase = await createClient();

  // 1. Fetch candidate profile
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 2. Fetch skills
  let skills: any[] = [];
  if (profile?.id) {
    const { data: skillsData } = await supabase
      .from("candidate_skills")
      .select("id, skill_name, skill_level, years_experience")
      .eq("candidate_id", profile.id)
      .order("created_at", { ascending: true });
    if (skillsData) skills = skillsData;
  }

  // 3. Fetch past projects
  let projects: any[] = [];
  if (profile?.id) {
    const { data: projectsData } = await supabase
      .from("candidate_projects")
      .select("id, title, description, technologies, repository_url, live_url")
      .eq("candidate_id", profile.id)
      .order("created_at", { ascending: false });
    if (projectsData) projects = projectsData;
  }

  // 4. Fetch verified completed trials & feedback
  let verifiedTrials: any[] = [];
  if (profile?.id) {
    const { data: feedbackData } = await supabase
      .from("project_feedback")
      .select(`
        id,
        requirements_completed,
        technical_quality,
        written_feedback,
        created_at,
        projects (title, payment_amount, currency),
        companies (name)
      `)
      .eq("candidate_id", profile.id);

    if (feedbackData) {
      verifiedTrials = feedbackData.map((f: any) => ({
        id: f.id,
        projectTitle: f.projects?.title || "Evaluation Project",
        companyName: f.companies?.name || "Startup Partner",
        completedAt: f.created_at,
        paymentAmount: f.projects?.payment_amount || 0,
        currency: f.projects?.currency || "INR",
        requirementsCompleted: f.requirements_completed,
        technicalQuality: f.technical_quality,
        writtenFeedback: f.written_feedback,
        outcome: null,
      }));
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* 1. Main LinkedIn Banner & Intro Card */}
      <ProfileIntroCard user={user} profile={profile} />

      {/* 2. About Narrative Card */}
      <ProfileAboutCard bio={profile?.bio || null} />

      {/* 3. Featured Technical Projects Card */}
      <FeaturedProjectsCard projects={projects} />

      {/* 4. Skills & Technical Stack Card */}
      <SkillsCard skills={skills} />

      {/* 5. Verified Provento Work History */}
      <VerifiedHistoryCard trials={verifiedTrials} />
    </div>
  );
}
