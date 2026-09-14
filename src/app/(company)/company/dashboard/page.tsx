import { requireRole } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Building2, Users, CheckSquare, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export default async function CompanyDashboardPage() {
  const user = await requireRole(["company", "admin"]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Startup Hiring Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate emerging technical talent through standardized paid work before hiring.
          </p>
        </div>
        <Link href="/company/projects/create">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <PlusCircle className="h-4 w-4" />
            <span>Create Trial Project</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Projects</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">Accepting applications</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Applicants</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">Across all projects</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">In Progress</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">Being completed by candidate</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Hires Made</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">0</div>
          <div className="text-xs text-slate-400 mt-1">From project evaluations</div>
        </Card>
      </div>

      {/* Evaluation Funnel Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Active Evaluation Funnel</h2>
        <EmptyState
          title="No evaluation projects created yet"
          description="Create a standardized 5–10 hour project (e.g. ₹5,000 budget) linked to an open junior technical role."
          actionText="Create First Evaluation Project"
          actionHref="/company/projects/create"
        />
      </div>
    </div>
  );
}
