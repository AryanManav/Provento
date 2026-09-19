import { requireAdmin } from "@/lib/auth/guards";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, FileText, CheckCircle2 } from "lucide-react";

export default async function AdminOverviewPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-300 pb-5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            System Administration
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-2">
          Platform Governance & Metrics
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Monitor marketplace integrity, company verifications, project moderation, and
          evaluation outcomes.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Total Candidates</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2">0</div>
          <div className="text-xs text-slate-400 mt-1">Registered users</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Registered Startups</span>
            <Building className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2">0</div>
          <div className="text-xs text-slate-400 mt-1">Company profiles</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Published Projects</span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2">0</div>
          <div className="text-xs text-slate-400 mt-1">Active paid sprints</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Interviews & Hires</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 mt-2">0 / 0</div>
          <div className="text-xs text-slate-400 mt-1">Outcomes achieved</div>
        </Card>
      </div>

      {/* Moderation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Project Moderation</CardTitle>
            <CardDescription>
              Review new trial projects submitted by companies to maintain quality
              standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            No projects pending review.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disputes & Escalations</CardTitle>
            <CardDescription>
              Monitor project deadline extensions, review non-responsive parties, or
              milestone issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            Zero active disputes.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
