import { requireRole } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export default async function CompanyProjectsListPage() {
  const user = await requireRole(["company", "admin"]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Evaluation Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your standardized hiring projects and review incoming submissions.
          </p>
        </div>
        <Link href="/company/projects/create">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <PlusCircle className="h-4 w-4" />
            <span>Create New Project</span>
          </Button>
        </Link>
      </div>

      <EmptyState
        title="No projects created yet"
        description="Create a well-defined paid project to start evaluating emerging junior candidates."
        actionText="Create Project"
        actionHref="/company/projects/create"
      />
    </div>
  );
}
