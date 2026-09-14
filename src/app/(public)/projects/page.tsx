import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Clock, Banknote, Building, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

export default async function ProjectsDirectoryPage() {
  const supabase = await createClient();
  
  let projects: any[] = [];
  try {
    const { data } = await supabase
      .from("projects")
      .select("id, title, slug, description, expected_hours, payment_amount, currency, status, created_at, companies (name, location)")
      .in("status", ["published", "applications_open"])
      .order("created_at", { ascending: false });
    if (data) projects = data;
  } catch {
    projects = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Open Evaluation Projects</h1>
          <p className="text-slate-600 mt-1">
            Browse paid trial projects from startups actively looking to hire junior engineers.
          </p>
        </div>
        <Link href="/signup?role=company">
          <Button variant="outline">Post an Evaluation Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No open projects right now"
          description="Companies post new standardized trial projects regularly. Sign up to get notified when a project matching your stack is published."
          actionText="Join as Candidate"
          actionHref="/signup?role=candidate"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between hover:border-indigo-300 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Building className="h-3.5 w-3.5" />
                    <span>{project.companies?.name || "Verified Startup"}</span>
                  </div>
                  <Badge variant="success">Applications Open</Badge>
                </div>
                <CardTitle className="text-xl text-slate-900 mt-2">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <Banknote className="h-4 w-4" />
                    <span>{formatCurrency(project.payment_amount, project.currency)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{project.expected_hours} hours effort</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4">
                <Link href={`/login?redirect=/projects/${project.slug}`} className="w-full">
                  <Button className="w-full gap-2">
                    <span>Apply for Evaluation</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
