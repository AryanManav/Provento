import { requireCandidate } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  Award,
  CheckCircle2,
  FileCode2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

export default async function CandidateDashboardPage() {
  const user = await requireCandidate();
  const supabase = await createClient();

  // 1. Fetch profile
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 2. Fetch skills
  let skillsCount = 0;
  if (profile?.id) {
    const { count } = await supabase
      .from("candidate_skills")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", profile.id);
    skillsCount = count || 0;
  }

  // 3. Fetch applications
  let applications: any[] = [];
  if (profile?.id) {
    const { data } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        projects (
          id,
          slug,
          title,
          payment_amount,
          currency,
          companies (name)
        )
      `)
      .eq("candidate_id", profile.id)
      .order("created_at", { ascending: false });
    if (data) applications = data;
  }

  // 4. Fetch open projects to display recommendations
  let openProjects: any[] = [];
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, slug, title, expected_hours, payment_amount, currency, companies(name)")
    .in("status", ["published", "applications_open"])
    .limit(3);
  if (projectsData) openProjects = projectsData;

  // Calculate Profile Strength (0 - 100%)
  let profileStrength = 20; // baseline for created account
  if (profile?.headline) profileStrength += 20;
  if (profile?.bio) profileStrength += 15;
  if (skillsCount > 0) profileStrength += 20;
  if (profile?.github_url) profileStrength += 15;
  if (profile?.resume_url) profileStrength += 10;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 3-Column LinkedIn Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Mini Profile Snapshot & Strength (4 cols on lg) */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-sm overflow-hidden">
            {/* Banner top */}
            <div className="h-20 bg-gradient-to-r from-[#0a66c2] to-[#004182]" />
            <div className="px-5 pb-5 pt-0 -mt-10 text-center">
              <div className="h-20 w-20 mx-auto rounded-full border-4 border-white bg-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-sm">
                {getInitials(user.fullName)}
              </div>
              <h2 className="font-bold text-base text-[#191919] mt-2">{user.fullName}</h2>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                {profile?.headline || "Junior Technical Candidate"}
              </p>

              {/* Profile Strength Meter */}
              <div className="mt-4 pt-4 border-t border-slate-100 text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Profile Strength</span>
                  <span className="text-[#0a66c2]">{profileStrength}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0a66c2] h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>
                {profileStrength < 100 && (
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Add skills and GitHub repo to increase selection rate.
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link href="/candidate/profile">
                  <Button variant="outline" size="sm" className="w-full rounded-full text-xs">
                    View & Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Key Metrics Card */}
          <div className="rounded-xl border border-[#e0dfdc] bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Metrics</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Active Trials</span>
                <span className="font-bold text-[#191919]">0</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Applications Sent</span>
                <span className="font-bold text-[#191919]">{applications.length}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Verified Completed</span>
                <span className="font-bold text-[#191919]">0</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Guaranteed Earnings</span>
                <span className="font-bold text-emerald-600">₹0</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Main Activity Feed & Applications (8 cols) */}
        <div className="md:col-span-8 space-y-5">
          
          {/* Welcome Action Banner */}
          <div className="rounded-xl border border-[#e0dfdc] bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0a66c2]" />
                <h2 className="text-base font-bold text-[#191919]">Prove Ability Through Real Work</h2>
              </div>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                Apply for paid micro-projects posted by startups. Once selected, complete the task to prove your abilities and earn verified credentials.
              </p>
            </div>
            <Link href="/projects">
              <Button size="sm" className="rounded-full shrink-0 gap-1.5 text-xs">
                <span>Browse Projects</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Recent Applications Section */}
          <div className="rounded-xl border border-[#e0dfdc] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#191919]">Recent Project Applications</h2>
              <Link href="/candidate/applications" className="text-xs font-semibold text-[#0a66c2] hover:underline">
                View All ({applications.length})
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No applications submitted yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Discover a project matching your skills and submit your application proposal.
                </p>
                <Link href="/projects">
                  <Button size="sm" variant="outline" className="mt-3 rounded-full text-xs">
                    Explore Opportunities
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div>
                      <h3 className="font-semibold text-xs text-[#191919]">
                        {app.projects?.title}
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {app.projects?.companies?.name || "Startup"} • Applied {formatDate(app.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(app.projects?.payment_amount || 0, app.projects?.currency || "INR")}
                      </span>
                      <Badge variant="secondary" className="capitalize text-[10px]">
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Recommended Projects Section */}
          <div className="rounded-xl border border-[#e0dfdc] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#191919]">Recommended Trial Projects</h2>
              <Link href="/projects" className="text-xs font-semibold text-[#0a66c2] hover:underline">
                Explore Directory
              </Link>
            </div>

            {openProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Startups are currently creating new projects. Check back shortly.
              </p>
            ) : (
              <div className="space-y-3">
                {openProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#0a66c2] transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-[#191919]">{proj.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{proj.companies?.name || "Verified Startup"}</span>
                        <span>•</span>
                        <span>{proj.expected_hours}h effort</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(proj.payment_amount, proj.currency)}
                        </span>
                      </div>
                    </div>

                    <Link href={`/projects`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs shrink-0">
                        View Project
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
