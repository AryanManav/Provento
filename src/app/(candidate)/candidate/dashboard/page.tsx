import { requireCandidate } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Clock, Award, FileCode2, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export default async function CandidateDashboardPage() {
  const user = await requireCandidate();

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {user.fullName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your active trial projects, applications, and verified work history.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Projects</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">Currently in progress</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Applications</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">Under startup review</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Completed Projects</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">Verified on profile</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Earned to Date</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">₹0</div>
          <div className="text-xs text-slate-400 mt-1">100% paid milestone work</div>
        </Card>
      </div>

      {/* Primary Action Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              <span>Explore Opportunities</span>
            </CardTitle>
            <CardDescription>
              Find standardized trial projects posted by startups in your stack.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/projects">
              <Button className="w-full gap-2">
                <span>Browse Open Projects</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <span>Complete Candidate Profile</span>
            </CardTitle>
            <CardDescription>
              Add your tech stack, GitHub repo links, and education to boost selection rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/candidate/profile">
              <Button variant="outline" className="w-full gap-2">
                <span>Edit Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Work / Applications */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Current Work & Applications</h2>
        <EmptyState
          title="No applications submitted yet"
          description="You have not applied to any paid trial projects yet. Browse active startup projects and submit an application."
          actionText="Browse Open Projects"
          actionHref="/projects"
        />
      </div>
    </div>
  );
}
