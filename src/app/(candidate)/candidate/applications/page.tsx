import { requireCandidate } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Clock, Building, ArrowRight, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

export default async function CandidateApplicationsPage() {
  const user = await requireCandidate();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let applications: any[] = [];
  if (profile?.id) {
    const { data } = await supabase
      .from("applications")
      .select(`
        id,
        cover_message,
        status,
        created_at,
        projects (
          id,
          slug,
          title,
          expected_hours,
          payment_amount,
          currency,
          companies (
            name,
            location
          )
        )
      `)
      .eq("candidate_id", profile.id)
      .order("created_at", { ascending: false });

    if (data) applications = data;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selected":
        return <Badge variant="success" className="font-semibold">Selected for Project</Badge>;
      case "shortlisted":
        return <Badge variant="default" className="bg-[#0a66c2] text-white">Shortlisted</Badge>;
      case "reviewing":
        return <Badge variant="warning">Under Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Not Selected</Badge>;
      default:
        return <Badge variant="secondary">Application Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="rounded-xl border border-[#e0dfdc] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#191919]">My Applications</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track the evaluation status of all your submitted paid trial project applications.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications submitted yet"
          description="Browse available trial projects posted by startups and submit an application to prove your skills."
          actionText="Discover Open Projects"
          actionHref="/projects"
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-[#e0dfdc] bg-white p-5 shadow-sm hover:border-[#0a66c2] transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#191919]">
                    {app.projects?.title || "Evaluation Project"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building className="h-3.5 w-3.5" />
                      {app.projects?.companies?.name || "Startup"}
                    </span>
                    <span>•</span>
                    <span>Applied {formatDate(app.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency(app.projects?.payment_amount || 0, app.projects?.currency || "INR")}
                  </span>
                  {getStatusBadge(app.status)}
                </div>
              </div>

              {app.cover_message && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2">
                  <span className="font-semibold text-slate-700">Your proposal: </span>
                  {app.cover_message}
                </div>
              )}

              {app.status === "selected" && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Congratulations! You were selected by the startup for this trial project.
                  </span>
                  <Link href={`/candidate/dashboard`}>
                    <Button size="sm" className="h-8 rounded-full text-xs">
                      Go to Project Workspace
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
